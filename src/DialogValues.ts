import * as vscode from "vscode";

/**
 * The values of the dialog.
 */
export class DialogValues {
  /**
   * The uri, if the dialog was called on any file.
   */
  uri?: vscode.Uri;

  /**
   * The values that were given by the user.
   * The key is the input, which was used to get the value.
   * The value is always stored as a string[], even if it is only a string.
   */
  inputValues = new Map<string, string[]>();

  /**
   * Adds a value to the inputValues.
   *
   * @param inputName - the name of the input which was used to get any value from the user
   * @param result - the result given by the user
   */
  addValue(inputName: string, result: string | string[] | boolean): void {
    // create the elements for storing it in the input values
    const elements: string[] = [];
    if (typeof result === "string") {
      elements.push(result);
    } else if (Array.isArray(result)) {
      result.forEach((pResult) => elements.push(pResult));
    } else if (typeof result === "boolean") {
      elements.push(result.toString());
    }

    // and store it there
    this.inputValues.set(inputName, elements);
  }
}
