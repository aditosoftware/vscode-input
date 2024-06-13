import { DialogValues, InputAction, InputBase, InputBaseOptions } from "..";
import * as vscode from "vscode";

/**
 * Namespace for any input box.
 */
export namespace InputBox {
  /**
   * The options for the input box.
   */
  export interface InputBoxOptions extends InputBaseOptions {
    /**
     * Any vscode options for the input box.
     */
    readonly inputBoxOptions?: vscode.InputBoxOptions;
  }
}

/**
 * Input for any free text.
 */
export class InputBox extends InputBase<InputBox.InputBoxOptions> {
  async showDialog(
    currentResults: DialogValues,
    currentStep: number,
    maximumStep: number
  ): Promise<string | InputAction | undefined> {
    const inputBox = vscode.window.createInputBox();

    // copy the options, so they will not persist during multiple dialogs
    const options: vscode.InputBoxOptions = { ...this.inputOptions.inputBoxOptions };
    const stepOutput = this.generateStepOutput(currentStep, maximumStep);
    if (options.title) {
      // add the step indicator to the title
      options.title += ` ${stepOutput}`;
    } else {
      // fallback, if no title was given
      options.title = `Choose a value ${stepOutput}`;
    }

    // find out the value to set:
    // if there is an value from the inputValues with the name, use it.
    // otherwise look in the options, if there is one given
    const value = currentResults.inputValues.get(this.inputOptions.name)?.[0] ?? options.value ?? "";

    // set all the options to the input box
    inputBox.title = options.title;
    inputBox.value = value;
    inputBox.valueSelection = options.valueSelection;
    inputBox.prompt = options.prompt;
    inputBox.placeholder = options.placeHolder;
    inputBox.password = options.password ?? false;
    inputBox.ignoreFocusOut = options.ignoreFocusOut ?? false;
    inputBox.valueSelection = options.valueSelection;

    // add a back button when it is not the first step
    if (currentStep !== 1) {
      inputBox.buttons = [vscode.QuickInputButtons.Back];
    }

    this.disposables.push(
      // handle the validation message
      inputBox.onDidChangeValue(async (text) => {
        if (options.validateInput) {
          const validationMessage = await options.validateInput(text);
          if (validationMessage) {
            inputBox.validationMessage = validationMessage;
          } else {
            inputBox.validationMessage = undefined;
          }
        }
      })
    );

    return new Promise<string | InputAction | undefined>((resolve) => {
      this.disposables.push(
        // handle the back button
        inputBox.onDidTriggerButton((button) => {
          if (button === vscode.QuickInputButtons.Back) {
            resolve(InputAction.BACK);
          }
        }),

        // handle the accept of the input
        inputBox.onDidAccept(async () => {
          const currentValue = inputBox.value;

          if (options.validateInput) {
            if (!(await options.validateInput(currentValue))) {
              // if there is validation, check if it has no validation message
              resolve(currentValue);
            }
          } else {
            // otherwise, just return normally
            resolve(currentValue);
          }
        }),

        // handle the hiding of the input
        inputBox.onDidHide(() => {
          resolve(undefined);
        })
      );

      // show the input box
      inputBox.show();

      this.disposables.push(inputBox);
    });
  }
}
