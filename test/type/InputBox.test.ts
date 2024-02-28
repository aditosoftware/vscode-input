import Sinon from "sinon";
import { DialogValues, InputBox } from "../../src";
import * as vscode from "vscode";

/**
 * Tests the input box dialog.
 */
suite("InputBox Tests", () => {
  let showInputBoxStub: Sinon.SinonStub;

  /**
   * Creates the necessary stubs before each test.
   */
  setup("create stubs", () => {
    showInputBoxStub = Sinon.stub(vscode.window, "showInputBox").resolves();
  });

  /**
   * Restore all the stubs after each test.
   */
  teardown("restore stubs", () => {
    showInputBoxStub.restore();
  });

  /**
   * Tests that a dummy title is created when no title is provided.
   */
  test("showDialog should create correct title when no title is provided", async () => {
    const inputBox = new InputBox({ name: "Unit", inputBoxOptions: {} });

    await inputBox.showDialog(new DialogValues(), 2, 4);

    Sinon.assert.calledWithMatch(showInputBoxStub, { title: "Choose a value (Step 2 of 4)" });
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

    Sinon.assert.calledWithMatch(showInputBoxStub, { title: "My Title (Step 2 of 4)" });
  });

  /**
   * Tests that various InputBoxOptions will be preserved after the execution.
   */
  test("showDialog should preserve all options", async () => {
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
      },
    });

    await inputBox.showDialog(new DialogValues(), 2, 4);

    Sinon.assert.calledWithMatch(showInputBoxStub, {
      title: "My Title (Step 2 of 4)",
      ignoreFocusOut: true,
      password: true,
      placeHolder: "my placeholder",
      prompt: "my prompt",
      value: "my value",
      valueSelection: [3, 7],
    });
  });
});
