import { AfterInputType, BeforeInputType, DialogValues, InputBase } from "..";
import * as vscode from "vscode";

/**
 * Any confirmation dialog.
 * This dialog will be shown as a modal dialog and therefore be in the front.
 */
export class ConfirmationDialog extends InputBase {
  /**
   * Constructor.
   *
   * @param message - The normal message of the dialog.
   * @param detail -  The detail message of this modal dialog. This will be dynamically generated from the other inputs.
   * @param confirmButtonName - The name of the confirm button.
   */
  constructor(
    private message: string,
    private detail: (currentResult: DialogValues) => string,
    private confirmButtonName: string,
    beforeInput?: BeforeInputType,
    afterInput?: AfterInputType
  ) {
    super("Confirmation", beforeInput, afterInput);

    this.message = message;
    this.detail = detail;
    this.confirmButtonName = confirmButtonName;
  }

  async showDialog(currentResults: DialogValues): Promise<boolean | undefined> {
    // show the dialog and only return true, if Yes was selected
    const answer = await vscode.window.showInformationMessage(
      this.message,
      {
        detail: this.detail(currentResults),
        modal: true,
      },

      // pack into MessageItem, because otherwise tests and mocking will not work
      {
        title: this.confirmButtonName,
      }
    );

    if (answer?.title === this.confirmButtonName) {
      return true;
    }
  }
}
