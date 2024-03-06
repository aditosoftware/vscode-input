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
  async showDialog(
    _currentResults: DialogValues,
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

    return vscode.window.showOpenDialog(options).then((uri) => {
      if (uri && uri.length !== 0) {
        // get from any uri the fileSystem path
        return uri.map((pElement) => pElement.fsPath);
      }
    });
  }
}
