import path from "path";
import { DialogValues, InputBase, InputBaseOptions } from "..";
import * as vscode from "vscode";

/**
 * Namespace for any open dialogs
 */
export namespace OpenDialog {
  /**
   * Any options for Open Dialogs.
   */
  export interface OpenDialogOptions extends InputBaseOptions {
    /**
     * Any vscode options for the open dialog
     */
    readonly openDialogOptions: vscode.OpenDialogOptions;
  }
}

/**
 * Input for any Open Dialog (files and directory).
 */
export class OpenDialog extends InputBase<OpenDialog.OpenDialogOptions> {
  /**
   * @override
   */
  async showDialog(
    currentResults: DialogValues,
    currentStep: number,
    maximumStep: number
  ): Promise<string[] | undefined> {
    const stepOutput = this.generateStepOutput(currentStep, maximumStep);

    // copy the options, so they will not persist during multiple dialogs
    const options = { ...this.inputOptions.openDialogOptions };
    if (options.title) {
      options.title += ` ${stepOutput}`;
    } else {
      options.title = `Select a ${options.canSelectFolders ? "Directory" : "File"} ${stepOutput}`;
    }

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
