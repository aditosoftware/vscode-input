import Sinon from "sinon";
import { DialogValues, InputAction, InputBox } from "../../src";
import * as vscode from "vscode";
import assert from "assert";

/**
 * Tests the input box dialog.
 */
suite("InputBox Tests", () => {
  const normalInputBox: vscode.InputBox = vscode.window.createInputBox();

  let inputBoxWithAccept: vscode.InputBox;

  let createInputBoxStub: Sinon.SinonStub;

  /**
   * Creates the necessary stubs before each test.
   */
  setup("create stubs", () => {
    const copyElementWithAccept = Object.create(normalInputBox);
    copyElementWithAccept.onDidAccept = (callback: () => void) => callback();
    inputBoxWithAccept = copyElementWithAccept as vscode.InputBox;

    createInputBoxStub = Sinon.stub(vscode.window, "createInputBox").returns(inputBoxWithAccept);
  });

  /**
   * Restore all the stubs after each test.
   */
  teardown("restore stubs", () => {
    createInputBoxStub.restore();
  });

  /**
   * Tests that `undefined` should be returned, when the input was hidden.
   */
  test("should hide correctly", async () => {
    const copyElementWithHide = Object.create(normalInputBox);
    copyElementWithHide.onDidHide = (callback: () => void) => callback();
    const inputBoxWithHide = copyElementWithHide as vscode.InputBox;

    createInputBoxStub.returns(inputBoxWithHide);

    const inputBox = new InputBox({ name: "Unit" });

    const result = await inputBox.showDialog(new DialogValues(), 2, 4);

    assert.deepStrictEqual(result, undefined);
  });

  /**
   * Tests that `showDialog` works correctly, when no `inputBoxOptions` (and therefore no title) is provided.
   */
  test("showDialog should work correctly, if no inputBoxOptions are provided", async () => {
    const inputBox = new InputBox({ name: "Unit" });

    await inputBox.showDialog(new DialogValues(), 2, 4);

    assert.strictEqual(inputBoxWithAccept.title, "Choose a value (Step 2 of 4)");
  });

  /**
   * Tests that a dummy title is created when no title is provided.
   */
  test("showDialog should create correct title when no title is provided", async () => {
    const inputBox = new InputBox({ name: "Unit", inputBoxOptions: {} });

    await inputBox.showDialog(new DialogValues(), 2, 4);

    assert.strictEqual(inputBoxWithAccept.title, "Choose a value (Step 2 of 4)");
  });

  /**
   * Tests that an existing title will be correctly transformed into the title with step indicator.
   */
  test("showDialog should create correct title when title is provided", async () => {
    const inputBox = new InputBox({
      name: "Unit",
      inputBoxOptions: { title: "My Title" },
    });

    await inputBox.showDialog(new DialogValues(), 2, 4);

    assert.strictEqual(inputBoxWithAccept.title, "My Title (Step 2 of 4)");
  });

  /**
   * Tests that the input box should not have a button, when it is the first step.
   */
  test("should not have a back button when first step", async () => {
    const inputBox = new InputBox({ name: "Unit" });

    await inputBox.showDialog(new DialogValues(), 1, 4);

    assert.deepStrictEqual(inputBoxWithAccept.buttons, [], `No buttons should be there ${inputBoxWithAccept.buttons}`);
  });

  /**
   * Tests that the input box should have a back button, when it is not the first step.
   */
  test("should have a back button when not first step", async () => {
    const inputBox = new InputBox({ name: "Unit" });

    await inputBox.showDialog(new DialogValues(), 2, 4);

    assert.deepStrictEqual(inputBoxWithAccept.buttons, [vscode.QuickInputButtons.Back]);
  });

  /**
   * Tests that the back action will be returned, when the back button was pressed.
   */
  test("should trigger back correctly", async () => {
    const copyElementWithBack = Object.create(normalInputBox);
    copyElementWithBack.onDidTriggerButton = (callback: (button: vscode.QuickInputButton) => void) =>
      callback(vscode.QuickInputButtons.Back);
    const inputBoxWithBack = copyElementWithBack as vscode.InputBox;

    createInputBoxStub.returns(inputBoxWithBack);

    const inputBox = new InputBox({ name: "Unit" });

    const result = await inputBox.showDialog(new DialogValues(), 2, 4);

    assert.deepStrictEqual(result, InputAction.BACK);
  });

  [
    {
      description: "with invalid value",
      textToValidate: "foo",
      expectedValidationMessage: "Invalid",
    },
    {
      description: "with valid value",
      textToValidate: "bar",
      expectedValidationMessage: undefined,
    },
  ].forEach((pArgument) => {
    /**
     * Tests that the validation will work correctly in the onDidChangeValue method.
     */
    test(`should validate correctly in onDidChangeValue ${pArgument.description}`, async () => {
      const inputBoxWithValueChange = createInputBoxWithValueChange(normalInputBox, pArgument.textToValidate);
      createInputBoxStub.returns(inputBoxWithValueChange);

      const inputBox = new InputBox({
        name: "Unit",
        inputBoxOptions: {
          validateInput: (pValue) => (pValue === "foo" ? "Invalid" : undefined),
        },
      });

      await inputBox.showDialog(new DialogValues(), 2, 4);

      assert.strictEqual(
        inputBoxWithValueChange.validationMessage,
        pArgument.expectedValidationMessage,
        "validationMessage"
      );
    });
  });

  const timeoutText = "Operation timed out";
  [
    {
      description: "with invalid value",
      value: "foo",
      result: timeoutText,
    },
    {
      description: "with valid value",
      value: "bar",
      result: "bar",
    },
  ].forEach((pArgument) => {
    /**
     * Tests that the validation will be considered in the onDidAccept method.
     */
    test(`should validate in onDidAccept ${pArgument.description}`, async () => {
      const inputBox = new InputBox({
        name: "Unit",
        inputBoxOptions: {
          value: pArgument.value,
          validateInput: (pValue) => (pValue === "foo" ? "Invalid" : undefined),
        },
      });

      // If the validation will fail, we would have a timeout, because we never get a result from the box.
      // Because of this, we are having here a timeout of 1000 ms.
      // This will resolve with our `timeoutText` after the time, in order to not having the method going into a timeout.
      const result = await new Promise<string | undefined>((resolve, reject) => {
        const timer = setTimeout(() => {
          resolve(timeoutText);
        }, 1000);

        inputBox
          .showDialog(new DialogValues(), 2, 4)
          .then((value) => {
            clearTimeout(timer);
            resolve(value);
          })
          .catch((err) => {
            clearTimeout(timer);
            reject(err);
          });
      });

      assert.strictEqual(result, pArgument.result, "result");
    });
  });

  /**
   * Tests that various InputBoxOptions will be preserved after the execution.
   */
  test("showDialog should preserve all options", async () => {
    const inputBoxWithValueChange = createInputBoxWithValueChange(normalInputBox, "foo");

    createInputBoxStub.returns(inputBoxWithValueChange);

    const inputBox = new InputBox({
      name: "Unit",
      inputBoxOptions: {
        title: "My Title",
        ignoreFocusOut: true,
        password: true,
        placeHolder: "my placeholder",
        prompt: "my prompt",
        value: "my value",
        valueSelection: [3, 7],
        validateInput: (pValue) => `This is invalid: ${pValue}`,
      },
    });

    await inputBox.showDialog(new DialogValues(), 2, 4);

    assert.strictEqual(inputBoxWithValueChange.title, "My Title (Step 2 of 4)", "title");
    assert.strictEqual(inputBoxWithValueChange.ignoreFocusOut, true, "ignoreFocusOut");
    assert.strictEqual(inputBoxWithValueChange.password, true, "password");
    assert.strictEqual(inputBoxWithValueChange.placeholder, "my placeholder", "placeHolder");
    assert.strictEqual(inputBoxWithValueChange.prompt, "my prompt", "prompt");
    assert.strictEqual(inputBoxWithValueChange.value, "my value", "value");
    assert.deepStrictEqual(inputBoxWithValueChange.valueSelection, [3, 7], "valueSelection");
    assert.strictEqual(inputBoxWithValueChange.validationMessage, "This is invalid: foo", "validationMessage");
  });
});

/**
 * Creates an input box. This will have its `onDidChangeValue` and `onDidHide` triggered immediately.
 *
 * @param normalInputBox - the normal input box on which the created input box should be based
 * @param textToValidate - the text that should be passed to the `onDidChangeValue` method
 * @returns the created input box.
 */
function createInputBoxWithValueChange(normalInputBox: vscode.InputBox, textToValidate: string): vscode.InputBox {
  const copyElementWithValueChange = Object.create(normalInputBox);
  copyElementWithValueChange.onDidChangeValue = (callback: (text: string) => void) => callback(textToValidate);
  copyElementWithValueChange.onDidHide = (callback: () => void) => callback();
  const inputBoxWithValueChange = copyElementWithValueChange as vscode.InputBox;
  return inputBoxWithValueChange;
}
