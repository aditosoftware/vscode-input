import { DialogValues } from "..";
import * as vscode from "vscode";

/**
 * The options of any input element.
 */
export interface InputBaseOptions {
  /**
   * The unique name which is needed to store the values.
   * This should be unique among all inputs from one multi-step input.
   */
  readonly name: string;

  /**
   * Function that should be executed before the input is shown.
   *
   * This function can be used the check, if the input should be shown or not. If the function returns `true`, then it should be shown.
   *
   * @param dialogValues - the current values of the dialog
   * @returns `true` if the dialog should be shown, `false`, if this dialog should be skipped
   */
  readonly onBeforeInput?: (dialogValues: DialogValues) => boolean;

  /**
   * Function that should be executed after the input was shown and the new value was saved into the dialog values.
   *
   * This can be for example used, if you get a value from any dialog values normal input that should be used as an uri instead.
   *
   * @param dialogValues - the current values of the dialog
   */
  readonly onAfterInput?: (dialogValues: DialogValues) => void;
}

/**
 * Indicates, that a action was triggered by the input.
 */
export enum InputAction {
  /**
   * When the back button was triggered.
   */
  BACK = "BACK",
}

/**
 * Any input for the extension.
 */
export abstract class InputBase<T extends InputBaseOptions> {
  /**
   * The options of any input element.
   */
  inputOptions: T;

  /**
   * The items that need to be disposed after the `showDialog` was called.
   */
  protected disposables: vscode.Disposable[] = [];

  /**
   * Constructor.
   *
   * @param inputOptions - the options of any input element
   */
  constructor(inputOptions: T) {
    this.inputOptions = inputOptions;
  }

  /**
   * Shows the dialog and returns the result of it.
   *
   * **Note:** If you override this method, you will need async.
   *
   * @param currentResults - the current results of the dialog
   * @param title - the title of the dialog. This should not be changed, but used as is. This title is the same for every input and contains the step count.
   * @param showBackButton - indicator, if the back button should be shown. It should not be shown, if this is the first step.
   * Some input types does not support a back button. If the input supports a back button, then it should be shown according to this flag.
   * @returns the inputted value or undefined, when any error / invalid input occurs
   */
  abstract showDialog(
    currentResults: DialogValues,
    title: string,
    showBackButton: boolean
  ): Promise<string | string[] | boolean | undefined | InputAction.BACK>;

  /**
   * Disposes everything from the given input after the dialog was shown and the values was received.
   */
  dispose(): void {
    this.disposables.forEach((pDisposable) => pDisposable.dispose());
  }
}
