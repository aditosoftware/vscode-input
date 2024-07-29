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

  const title = "My Title";
  const placeHolder = "My placeholder";

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

    const inputBox = new InputBox({ name: "Unit", inputBoxOptions: { placeHolder } });

    const result = await inputBox.showDialog(new DialogValues(), title, true);

    assert.deepStrictEqual(result, undefined);
  });

  /**
   * Tests that a given value for the name will be inputted into the value of the element.
   */
  test("should take old value", async () => {
    const name = "Unit";
    const value = "my value";

    const dialogValues = new DialogValues();
    dialogValues.addValue(name, value);

    const inputBox = new InputBox({ name: name, inputBoxOptions: { placeHolder } });

    await inputBox.showDialog(dialogValues, title, true);

    assert.strictEqual(inputBoxWithAccept.value, value);
  });

  /**
   * Tests that a given value for the name will be inputted into the value of the element, also when a old value is present.
   */
  test("should take old value over old value", async () => {
    const name = "Unit";
    const value = "my value";

    const dialogValues = new DialogValues();
    dialogValues.addValue(name, value);

    const inputBox = new InputBox({ name: name, inputBoxOptions: { value: "not used old value", placeHolder } });

    await inputBox.showDialog(dialogValues, title, true);

    assert.strictEqual(inputBoxWithAccept.value, value);
  });

  /**
   * Tests that `showDialog` works correctly, when no `inputBoxOptions` except the required ones are provided.
   * The title is implicitly provided by the method call
   */
  test("showDialog should work correctly, if no inputBoxOptions are provided", async () => {
    const inputBox = new InputBox({ name: "Unit", inputBoxOptions: { placeHolder } });

    await inputBox.showDialog(new DialogValues(), title, true);

    assert.strictEqual(inputBoxWithAccept.title, title);
  });

  /**
   * Tests that the input box should not have a button, when it should not show the button.
   */
  test("should not have a back button when it should not show the button", async () => {
    const inputBox = new InputBox({ name: "Unit", inputBoxOptions: { placeHolder } });

    await inputBox.showDialog(new DialogValues(), title, false);

    assert.deepStrictEqual(inputBoxWithAccept.buttons, [], `No buttons should be there ${inputBoxWithAccept.buttons}`);
  });

  /**
   * Tests that the input box should have a back button, when it is requested.
   */
  test("should have a back button when requested", async () => {
    const inputBox = new InputBox({ name: "Unit", inputBoxOptions: { placeHolder } });

    await inputBox.showDialog(new DialogValues(), title, true);

    assert.deepStrictEqual(inputBoxWithAccept.buttons, [vscode.QuickInputButtons.Back]);
  });

  /**
   * Tests that the back action will be returned, when the back button was pressed.
   */
  test("should trigger back correctly", async () => {
    const inputBoxWithBack = createInputBoxWithButtonTrigger(normalInputBox, vscode.QuickInputButtons.Back);

    createInputBoxStub.returns(inputBoxWithBack);

    const inputBox = new InputBox({ name: "Unit", inputBoxOptions: { placeHolder } });

    const result = await inputBox.showDialog(new DialogValues(), title, true);

    assert.deepStrictEqual(result, InputAction.BACK);
  });

  /**
   * Tests that a custom button will be added correctly and triggered as expected.
   */
  test("should add and trigger custom button correctly", async () => {
    const button: vscode.QuickInputButton = {
      iconPath: new vscode.ThemeIcon("squirrel"),
      tooltip: "do something",
    };

    let called = false;

    const inputBoxWithButtonTrigger = createInputBoxWithButtonTrigger(normalInputBox, button);

    createInputBoxStub.returns(inputBoxWithButtonTrigger);

    const inputBox = new InputBox({
      name: "Unit",
      inputBoxOptions: { placeHolder },
      customButton: {
        button: button,
        action: () => {
          called = true;
        },
      },
    });

    await inputBox.showDialog(new DialogValues(), title, true);

    assert.ok(called, "value was changed in the action");
    assert.deepStrictEqual(
      inputBoxWithButtonTrigger.buttons,
      [vscode.QuickInputButtons.Back, button],
      "button should be there"
    );
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
          placeHolder,
          validateInput: (pValue) => (pValue === "foo" ? "Invalid" : undefined),
        },
      });

      await inputBox.showDialog(new DialogValues(), title, true);

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
          placeHolder,
          value: pArgument.value,
          validateInput: (pValue) => (pValue === "foo" ? "Invalid" : undefined),
        },
      });

      // If the validation will fail, we would have a timeout, because we never get a result from the box.
      // Because of this, we are having here a timeout of 25 ms.
      // This will resolve with our `timeoutText` after the time, in order to not having the method going into a timeout.
      const result = await new Promise<string | undefined>((resolve, reject) => {
        const timer = setTimeout(() => {
          resolve(timeoutText);
        }, 25);

        inputBox
          .showDialog(new DialogValues(), title, true)
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
        ignoreFocusOut: true,
        password: true,
        placeHolder,
        prompt: "my prompt",
        value: "my value",
        valueSelection: [3, 7],
        validateInput: (pValue) => `This is invalid: ${pValue}`,
      },
    });

    await inputBox.showDialog(new DialogValues(), title, true);

    assert.strictEqual(inputBoxWithValueChange.title, title, "title");
    assert.strictEqual(inputBoxWithValueChange.ignoreFocusOut, true, "ignoreFocusOut");
    assert.strictEqual(inputBoxWithValueChange.password, true, "password");
    assert.strictEqual(inputBoxWithValueChange.placeholder, placeHolder, "placeHolder");
    assert.strictEqual(inputBoxWithValueChange.prompt, "my prompt", "prompt");
    assert.strictEqual(inputBoxWithValueChange.value, "my value", "value");
    assert.deepStrictEqual(inputBoxWithValueChange.valueSelection, [3, 7], "valueSelection");
    assert.strictEqual(inputBoxWithValueChange.validationMessage, "This is invalid: foo", "validationMessage");
  });
});

/**
 * Creates an input box. This will have its `onDidTriggerButton` (with a specific button) and `onDidHide` triggered immediately.
 *
 * @param normalInputBox - the normal input box on which the created input box should be based
 * @param button - the button that should be transferred and triggered in the `onDidTriggerButton` method
 * @returns the created input box
 */
function createInputBoxWithButtonTrigger(
  normalInputBox: vscode.InputBox,
  button: vscode.QuickInputButton
): vscode.InputBox {
  const copyElementWithButtonTrigger = Object.create(normalInputBox);
  copyElementWithButtonTrigger.onDidTriggerButton = (callback: (button: vscode.QuickInputButton) => void) =>
    callback(button);
  copyElementWithButtonTrigger.onDidHide = (callback: () => void) => callback();
  const inputBoxWithButtonTrigger = copyElementWithButtonTrigger as vscode.InputBox;
  return inputBoxWithButtonTrigger;
}

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
