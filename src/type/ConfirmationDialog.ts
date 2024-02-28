import { DialogValues, InputBase, InputBaseOptions } from "..";
import * as vscode from "vscode";

/**
 * The options for any confirmation dialog.
 */
interface ConfirmationDialogOptions extends InputBaseOptions {
  /**
   *  The normal message of the dialog.
   */
  readonly message: string;

  /**
   * The detail message of this modal dialog. This will be dynamically generated from the other inputs.
   * @param currentResult - the current dialog results
   * @returns the generated detail message
   */
  readonly detail: (currentResult: DialogValues) => string;

  /**
   * The name of the confirm button.
   */
  readonly confirmButtonName: string;
}

/**
 * Any confirmation dialog.
 * This dialog will be shown as a modal dialog and therefore be in the front.
 */
export class ConfirmationDialog extends InputBase<ConfirmationDialogOptions> {

  async showDialog(currentResults: DialogValues): Promise<boolean | undefined> {
    // show the dialog and only return true, if Yes was selected
    const answer = await vscode.window.showInformationMessage(
      this.inputOptions.message,
      {
        detail: this.inputOptions.detail(currentResults),
        modal: true,
      },

      // pack into MessageItem, because otherwise tests and mocking will not work
      {
        title: this.inputOptions.confirmButtonName,
      }
    );

    if (answer?.title === this.inputOptions.confirmButtonName) {
      return true;
    }
  }
}
