import { DialogValues, InputBase, InputBaseOptions } from "..";
import * as vscode from "vscode";

/**
 * The options for the input box.
 */
interface InputBoxOptions extends InputBaseOptions {
  /**
   * Any vscode options for the input box.
   */
  readonly inputBoxOptions?: vscode.InputBoxOptions;
}

/**
 * Input for any free text.
 */
export class InputBox extends InputBase<InputBoxOptions> {
  async showDialog(
    _currentResults: DialogValues,
    currentStep: number,
    maximumStep: number
  ): Promise<string | undefined> {
    const stepOutput = this.generateStepOutput(currentStep, maximumStep);

    // copy the options, so they will not persist during multiple dialogs
    const options: vscode.InputBoxOptions = { ...this.inputOptions.inputBoxOptions };
    if (options.title) {
      // add the step indicator to the title
      options.title += ` ${stepOutput}`;
    } else {
      // fallback, if no title was given
      options.title = `Choose a value ${stepOutput}`;
    }

    return vscode.window.showInputBox(options);
  }
}
