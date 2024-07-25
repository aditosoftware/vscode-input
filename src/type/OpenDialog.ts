import path from "path";
import { DialogValues, InputBase, InputBaseOptions } from "..";
import * as vscode from "vscode";

/**
 * Namespace for any open dialogs
 */
export namespace OpenDialog {
  /**
   * Base Type for the options. This removes {@link vscode.OpenDialogOptions.title | title},
   * because it will be set by the multi-step-input and should be the same.
   */
  type BaseOpenDialogOptions = Omit<vscode.OpenDialogOptions, "title">;

  /**
   * Type that requires the {@link vscode.OpenDialogOptions.openLabel | openLabel} from the {@link vscode.OpenDialogOptions}
   * in order to have a input for the user what to select.
   */
  type RequiredOpenDialogOptions = BaseOpenDialogOptions & {
    openLabel: NonNullable<BaseOpenDialogOptions["openLabel"]>;
  };

  /**
   * Any options for Open Dialogs.
   */
  export interface OpenDialogOptions extends InputBaseOptions {
    /**
     * Any vscode options for the open dialog
     */
    readonly openDialogOptions: RequiredOpenDialogOptions;
  }
}

/**
 * Input for any Open Dialog (files and directory).
 */
export class OpenDialog extends InputBase<OpenDialog.OpenDialogOptions> {
  /**
   * @override
   */
  async showDialog(currentResults: DialogValues, title: string): Promise<string[] | undefined> {
    // copy the options, so they will not persist during multiple dialogs.
    // Also set them to vscode.OpenDialogOptions to be able to set the title which was omitted from our options.
    const options: vscode.OpenDialogOptions = { ...this.inputOptions.openDialogOptions };
    options.title = title;

    // find out the default uri that should be used
    const defaultUri = this.findOutDefaultUri(currentResults, options.defaultUri);
    // and set the calculated uri back to the options
    if (defaultUri) {
      options.defaultUri = defaultUri;
    }

    return vscode.window.showOpenDialog(options).then((uri) => {
      if (uri && uri.length !== 0) {
        // get from any uri the fileSystem path
        return uri.map((pElement) => pElement.fsPath);
      }
    });
  }

  /**
   * Finds out the default URI that should be used for the dialog options.
   *
   * If there are previous values from the dialog values, then these will be used.
   * Otherwise the configured option will used.
   *
   * @param currentResults - the current dialog values
   * @param defaultUriFromOptions - the defaultUri from the options that were given from the user
   * @returns the default uri that should be used for the dialog options
   */
  private findOutDefaultUri(currentResults: DialogValues, defaultUriFromOptions?: vscode.Uri): vscode.Uri | undefined {
    const currentValues = currentResults.inputValues.get(this.inputOptions.name);
    if (currentValues) {
      if (currentValues.length === 1) {
        // if there was only one selection, transform it back into an URI
        return vscode.Uri.file(currentValues[0]);
      } else {
        // otherwise, we need to find out the common path among all given values
        const normalizedPaths = currentValues.map((pPath) => path.normalize(pPath));
        const splitPaths = normalizedPaths.map((pPath) => pPath.split(path.sep));

        // find out the command segments among all path segments
        const commonSegments: string[] = [];
        for (let i = 0; i < splitPaths[0].length; i++) {
          const segment = splitPaths[0][i];
          if (splitPaths.every((path) => path[i] === segment)) {
            commonSegments.push(segment);
          } else {
            break;
          }
        }

        // Join the common segments back into a path
        const commonPath = path.join(...commonSegments);
        // and transform it into and URI
        return vscode.Uri.file(commonPath);
      }
    } else {
      // if there is no given selection, just use the value from the options
      return defaultUriFromOptions;
    }
  }
}
