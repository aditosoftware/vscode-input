import assert from "assert";
import {
  DialogValues,
  InputAction,
  InputBase,
  InputBaseOptions,
  InputBox,
  handleMultiStepInput,
  initializeLogger,
} from "../src";
import Sinon from "sinon";
import * as vscode from "vscode";
import path from "path";
import os from "os";
import { Logger } from "@aditosoftware/vscode-logging";

/**
 * Tests that the handling of multiStepInputs works.
 */
suite("handleMultiStepInput test", () => {
  /**
   * Spy for the debug log.
   */
  let debugLog: Sinon.SinonSpy;

  /**
   * Test element for an input.
   */
  let firstElement: TestElement;

  /**
   * Test element for a second input.
   */
  let secondElement: TestElement;

  /**
   * Test element for an input that returns `true` in their `beforeInput` method.
   */
  let beforeInputTrue: TestElement;

  /**
   * Test element for an input that returns `false` in their `beforeInput` method.
   */
  let beforeInputFalse: TestElement;

  /**
   * Initializes the the sinon values that are needed for the tests.
   */
  setup("initialize values", () => {
    // create a dummy log instance for the logging
    const context: vscode.ExtensionContext = {
      subscriptions: [],
      logUri: vscode.Uri.file(path.join(os.tmpdir(), "input")),
    } as unknown as vscode.ExtensionContext;
    Logger.initializeLogger(context, "Input");
    // and initialize the logger from the input with the currently created logger
    initializeLogger(Logger.getLogger());

    debugLog = Sinon.spy(Logger.getLogger(), "debug");

    // creates some test elements from the inputs
    firstElement = new TestElement(new InputBox({ name: "firstElement", inputBoxOptions: {} }));
    secondElement = new TestElement(new InputBox({ name: "secondElement", inputBoxOptions: {} }));
    beforeInputTrue = new TestElement(
      new InputBox({ name: "beforeInputTrue", inputBoxOptions: {}, onBeforeInput: () => true })
    );
    beforeInputFalse = new TestElement(
      new InputBox({ name: "beforeInputFalse", inputBoxOptions: {}, onBeforeInput: () => false })
    );
  });

  /**
   * Restores all the sinon objects
   */
  teardown("restore", () => {
    debugLog.restore();

    // restore all test elements
    firstElement.restore();
    secondElement.restore();
    beforeInputTrue.restore();
    beforeInputFalse.restore();
  });

  /**
   * Tests that the handling works with no inputs.
   */
  test("should work with no input value", async () => {
    const result = await handleMultiStepInput([]);

    assert.ok(typeof result !== "undefined", "result is there");
    assert.strictEqual(0, result.inputValues.size, "no input values");
    assert.strictEqual(undefined, result.confirmation, "no confirmation values");
  });

  /**
   * Tests that it will work with a single input that returns a value.
   */
  test("should work with single value", async () => {
    const myValue = "myValue";

    firstElement.showDialogStub.resolves(myValue);

    const result = await handleMultiStepInput([firstElement.input]);

    assert.ok(typeof result !== "undefined", "result is there");
    assert.strictEqual(undefined, result.confirmation, "no confirmation values");
    assert.deepStrictEqual(new Map<string, string[]>([[firstElement.name, [myValue]]]), result.inputValues);

    Sinon.assert.calledOnce(firstElement.showDialogStub);
    Sinon.assert.calledWith(firstElement.showDialogStub, Sinon.match.any, 1, 1);
  });

  /**
   * Tests that it will work with a single input that was cancelled.
   */
  test("should work with cancelled single value", async () => {
    firstElement.showDialogStub.resolves(undefined);

    const result = await handleMultiStepInput([firstElement.input]);

    assert.ok(typeof result === "undefined", "result is not there");

    Sinon.assert.calledOnce(firstElement.showDialogStub);
    Sinon.assert.calledWith(firstElement.showDialogStub, Sinon.match.any, 1, 1);
  });

  /**
   * Tests that multiple values are correctly handled.
   */
  test("should work with multiple values", async () => {
    const firstValues = "myValue";
    firstElement.showDialogStub.resolves(firstValues);

    const secondValues = ["a", "b", "c"];
    secondElement.showDialogStub.resolves(secondValues);

    const result = await handleMultiStepInput([firstElement.input, secondElement.input]);

    assert.ok(typeof result !== "undefined", "result is there");
    assert.strictEqual(undefined, result.confirmation, "no confirmation values");
    assert.deepStrictEqual(
      new Map<string, string[]>([
        [firstElement.name, [firstValues]],
        [secondElement.name, secondValues],
      ]),
      result.inputValues
    );

    Sinon.assert.calledOnce(firstElement.showDialogStub);
    Sinon.assert.calledWith(firstElement.showDialogStub, Sinon.match.any, 1, 2);
    Sinon.assert.calledOnce(secondElement.showDialogStub);
    Sinon.assert.calledWith(secondElement.showDialogStub, Sinon.match.any, 2, 2);
  });

  /**
   * Tests that the going back from the second element works.
   *
   * Workflow:
   * 1. input in `firstElement`
   * 2. go back in `secondElement`
   * 3. another input in `firstElement`
   * 4. input in `secondElement`
   */
  test("should work go back", async () => {
    const firstValues = "myValue";
    firstElement.showDialogStub.onFirstCall().resolves("not needed first value").onSecondCall().resolves(firstValues);

    const secondValues = ["a", "b", "c"];
    secondElement.showDialogStub.onFirstCall().resolves(InputAction.BACK).onSecondCall().resolves(secondValues);

    const result = await handleMultiStepInput([firstElement.input, secondElement.input]);

    assert.ok(typeof result !== "undefined", "result is there");
    assert.strictEqual(undefined, result.confirmation, "no confirmation values");
    assert.deepStrictEqual(
      new Map<string, string[]>([
        [firstElement.name, [firstValues]],
        [secondElement.name, secondValues],
      ]),
      result.inputValues
    );

    Sinon.assert.calledTwice(firstElement.showDialogStub);
    Sinon.assert.calledWith(firstElement.showDialogStub, Sinon.match.any, 1, 2);
    Sinon.assert.calledTwice(secondElement.showDialogStub);
    Sinon.assert.calledWith(secondElement.showDialogStub, Sinon.match.any, 2, 2);
  });

  /**
   * Tests that you can go back multiple times in a row:
   *
   * Workflow:
   * 1. input in `beforeInputTrue`
   * 2. input in `firstElement`
   * 3. go back in `secondElement`
   * 4. go back in `firstElement`
   * 5. input in `beforeInputTrue`
   * 6. input in `firstElement`
   * 7. input in `secondElement`
   */
  test("should work go back multiple times in a row", async () => {
    beforeInputTrue.showDialogStub.resolves("foo");

    const firstValues = "myValue";
    firstElement.showDialogStub
      .onFirstCall()
      .resolves("not needed first value")
      .onSecondCall()
      .resolves(InputAction.BACK)
      .onThirdCall()
      .resolves(firstValues);

    const secondValues = ["a", "b", "c"];
    secondElement.showDialogStub.onFirstCall().resolves(InputAction.BACK).onSecondCall().resolves(secondValues);

    const result = await handleMultiStepInput([beforeInputTrue.input, firstElement.input, secondElement.input]);

    assert.ok(typeof result !== "undefined", "result is there");
    assert.strictEqual(undefined, result.confirmation, "no confirmation values");
    assert.deepStrictEqual(
      new Map<string, string[]>([
        [beforeInputTrue.name, ["foo"]],
        [firstElement.name, [firstValues]],
        [secondElement.name, secondValues],
      ]),
      result.inputValues
    );

    Sinon.assert.calledTwice(beforeInputTrue.showDialogStub);
    Sinon.assert.calledWith(beforeInputTrue.showDialogStub, Sinon.match.any, 1, 3);
    Sinon.assert.calledThrice(firstElement.showDialogStub);
    Sinon.assert.calledWith(firstElement.showDialogStub, Sinon.match.any, 2, 3);
    Sinon.assert.calledTwice(secondElement.showDialogStub);
    Sinon.assert.calledWith(secondElement.showDialogStub, Sinon.match.any, 3, 3);
  });

  /**
   * Tests that a go back on the first element is working.
   */
  test("should work go back on first element", async () => {
    const firstValues = "myValue";
    firstElement.showDialogStub.onFirstCall().resolves(InputAction.BACK).onSecondCall().resolves(firstValues);

    const result = await handleMultiStepInput([firstElement.input]);

    assert.ok(typeof result !== "undefined", "result is there");
    assert.strictEqual(undefined, result.confirmation, "no confirmation values");
    assert.deepStrictEqual(new Map<string, string[]>([[firstElement.name, [firstValues]]]), result.inputValues);

    Sinon.assert.calledTwice(firstElement.showDialogStub);
    Sinon.assert.calledWith(firstElement.showDialogStub, Sinon.match.any, 1, 1);
  });

  /**
   * Tests the handling of `beforeInput`.
   */
  suite("handle beforeInput", () => {
    /**
     * Tests that the normal workflow works when returning `true` in the beforeInput.
     */
    test("should work with beforeInput returning true", async () => {
      const inputBoxValue = "myValue";
      beforeInputTrue.showDialogStub.resolves(inputBoxValue);

      const result = await handleMultiStepInput([beforeInputTrue.input]);

      assert.ok(typeof result !== "undefined", "result is there");
      assert.strictEqual(undefined, result.confirmation, "no confirmation values");
      assert.deepStrictEqual(new Map<string, string[]>([[beforeInputTrue.name, [inputBoxValue]]]), result.inputValues);

      Sinon.assert.calledOnce(beforeInputTrue.showDialogStub);
      Sinon.assert.calledWith(beforeInputTrue.showDialogStub, Sinon.match.any, 1, 1);
    });

    /**
     * Tests that a skipping will occur, if `beforeInput` returns `false`.
     */
    test("should skip before input (beforeInput to false)", async () => {
      const inputBoxValue = "myValue";

      beforeInputFalse.showDialogStub.resolves(inputBoxValue);

      const result = await handleMultiStepInput([beforeInputFalse.input]);

      assert.ok(typeof result !== "undefined", "result is there");
      assert.strictEqual(undefined, result.confirmation, "no confirmation values");
      assert.deepStrictEqual(new Map<string, string[]>(), result.inputValues);

      Sinon.assert.callCount(beforeInputFalse.showDialogStub, 0);
    });

    /**
     * Tests that a middle element will be skipped when one element will be skipped.
     */
    test("should skip one element ", async () => {
      firstElement.showDialogStub.resolves("myValue");
      beforeInputFalse.showDialogStub.resolves("myValue");
      secondElement.showDialogStub.resolves("myValue");

      const result = await handleMultiStepInput([firstElement.input, beforeInputFalse.input, secondElement.input]);

      assert.ok(typeof result !== "undefined", "result is there");
      assert.strictEqual(undefined, result.confirmation, "no confirmation values");
      // only the values from first and second box are there
      assert.deepStrictEqual([firstElement.name, secondElement.name], Array.from(result.inputValues.keys()));

      Sinon.assert.calledOnce(firstElement.showDialogStub);
      Sinon.assert.calledWith(firstElement.showDialogStub, Sinon.match.any, 1, 3);

      Sinon.assert.callCount(beforeInputFalse.showDialogStub, 0);

      // check that the indexes are adjusted after the skip
      Sinon.assert.calledOnce(secondElement.showDialogStub);
      Sinon.assert.calledWith(secondElement.showDialogStub, Sinon.match.any, 2, 2);
    });

    /**
     * Tests that a middle element will be skipped when one element will be skipped.
     */
    test("should skip correctly with go back one element ", async () => {
      const myValue = "myValue";
      firstElement.showDialogStub.onFirstCall().resolves("not needed").onSecondCall().resolves(myValue);
      beforeInputFalse.showDialogStub.resolves(myValue);
      secondElement.showDialogStub.onFirstCall().resolves(InputAction.BACK).onSecondCall().resolves(myValue);

      const result = await handleMultiStepInput([firstElement.input, beforeInputFalse.input, secondElement.input]);

      assert.ok(typeof result !== "undefined", "result is there");
      assert.strictEqual(undefined, result.confirmation, "no confirmation values");
      // only the values from first and second box are there
      assert.deepStrictEqual(
        new Map<string, string[]>([
          [firstElement.name, [myValue]],
          [secondElement.name, [myValue]],
        ]),
        result.inputValues
      );

      Sinon.assert.calledTwice(firstElement.showDialogStub);
      Sinon.assert.calledWith(firstElement.showDialogStub, Sinon.match.any, 1, 3);

      Sinon.assert.callCount(beforeInputFalse.showDialogStub, 0);

      // check that the indexes are adjusted after the skip
      Sinon.assert.calledTwice(secondElement.showDialogStub);
      Sinon.assert.calledWith(secondElement.showDialogStub, Sinon.match.any, 2, 2);
    });
  });

  /**
   * Tests that any `afterInput` will be handled.
   */
  test("should handle after input", async () => {
    const name = "myInputBox";
    const myValue = "myValue";

    let afterInput: Map<string, string[]> = new Map<string, string[]>();

    const inputBox = new InputBox({
      name: name,
      inputBoxOptions: {},
      onAfterInput: (dialogValues: DialogValues) => {
        afterInput = dialogValues.inputValues;
      },
    });
    const showDialogStub = Sinon.stub(inputBox, "showDialog").resolves(myValue);

    const result = await handleMultiStepInput([inputBox]);

    assert.ok(typeof result !== "undefined", "result is there");
    assert.strictEqual(undefined, result.confirmation, "no confirmation values");
    assert.deepStrictEqual(new Map<string, string[]>([[name, [myValue]]]), result.inputValues);
    // also check that after input was set to the new map
    assert.deepStrictEqual(new Map<string, string[]>([[name, [myValue]]]), afterInput);

    Sinon.assert.calledOnce(showDialogStub);
    Sinon.assert.calledWith(showDialogStub, Sinon.match.any, 1, 1);

    showDialogStub.restore();
  });

  /**
   * Tests that any previous given values are correctly taken and returned.
   */
  test("should work with previous dialog values", async () => {
    const myValue = "myValue";

    firstElement.showDialogStub.resolves(myValue);

    const oldDialogValues = new DialogValues();
    const oldKey = "myOldKey";
    const oldValue = ["myOldValue"];
    oldDialogValues.inputValues.set(oldKey, oldValue);

    const result = await handleMultiStepInput([firstElement.input], oldDialogValues);

    assert.ok(typeof result !== "undefined", "result is there");
    assert.strictEqual(undefined, result.confirmation, "no confirmation values");
    assert.deepStrictEqual(
      new Map<string, string[]>([
        [firstElement.name, [myValue]],
        [oldKey, oldValue],
      ]),
      result.inputValues
    );
    // old values should be also updated
    assert.deepStrictEqual(
      new Map<string, string[]>([
        [firstElement.name, [myValue]],
        [oldKey, oldValue],
      ]),
      oldDialogValues.inputValues
    );

    Sinon.assert.calledOnce(firstElement.showDialogStub);
    Sinon.assert.calledWith(firstElement.showDialogStub, Sinon.match.any, 1, 1);
  });
});

/**
 * Any element for the inputs.
 */
class TestElement {
  /**
   * The name of the input. This is also `input.inputOptions.name`.
   */
  name: string;

  /**
   * The input element that should be used for this test.
   */
  input: InputBase<InputBaseOptions>;

  /**
   * The stub of the method `showDialog`. This will be created in the constructor.
   * Your need to restore the stub via the `restore` method.
   */
  showDialogStub: Sinon.SinonStub;

  /**
   * Creates and extracts all relevant elements for a test element.
   * @param input - the input
   */
  constructor(input: InputBase<InputBaseOptions>) {
    this.input = input;
    this.name = input.inputOptions.name;
    this.showDialogStub = Sinon.stub(input, "showDialog");
  }

  /**
   * Restore all sinon stubs and spy objects. Should be called in the `teardown` method.
   */
  restore() {
    this.showDialogStub.restore();
  }
}
