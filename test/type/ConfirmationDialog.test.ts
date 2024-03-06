import assert from "assert";
import { ConfirmationDialog, DialogValues } from "../../src";
import Sinon from "sinon";
import * as vscode from "vscode";

/**
 * Tests the confirmation dialog.
 */
suite("ConfirmationDialog Tests", () => {
  let showInformationMessageStub: Sinon.SinonStub;

  /**
   * Creates the necessary stubs before each test.
   */
  setup("create stubs", () => {
    showInformationMessageStub = Sinon.stub(vscode.window, "showInformationMessage");
  });

  /**
   * Restore all the stubs after each test.
   */
  teardown("restore stubs", () => {
    showInformationMessageStub.restore();
  });

  /**
   * Tests that `true` will be returned, when the button in the dialog will be pressed.
   */
  test("showDialog should return true when confirm button is selected", async () => {
    const message = "my message";
    const confirmButtonTitle = "My Confirm";
    const confirmButtonItem = { title: confirmButtonTitle };

    // returns the confirm button when the promise is returned
    showInformationMessageStub.resolves(confirmButtonItem);

    // creates the dialog and shows it
    const dialog = new ConfirmationDialog({
      name: "Confirmation",
      message: message,
      detail: (dialogValues: DialogValues) => `Detail: ${dialogValues.inputValues.size}`,
      confirmButtonName: confirmButtonTitle,
    });
    const result = await dialog.showDialog(new DialogValues());

    // checks that the showDialog returns true
    assert.strictEqual(result, true);

    // assert the correct calls
    Sinon.assert.calledOnce(showInformationMessageStub);
    Sinon.assert.calledWithExactly(
      showInformationMessageStub,
      message,
      { detail: "Detail: 0", modal: true },
      confirmButtonItem
    );
  });

  /**
   * Tests that `undefined` will be returned when another button is selected.
   */
  test("showDialog should return undefined when another button is selected", async () => {
    showInformationMessageStub.resolves({ title: "Cancel" });

    const dialog = new ConfirmationDialog({
      name: "Confirmation",
      message: "message",
      detail: () => "detail",
      confirmButtonName: "button",
    });
    const result = await dialog.showDialog(new DialogValues());

    assert.strictEqual(result, undefined);
  });

  /**
   * Tests that `undefined` will be returned when no button is selected.
   */
  test("showDialog should return undefined when confirm button is not selected", async () => {
    showInformationMessageStub.resolves(undefined);

    const dialog = new ConfirmationDialog({
      name: "Confirmation",
      message: "message",
      detail: () => "detail",
      confirmButtonName: "button",
    });
    const result = await dialog.showDialog(new DialogValues());

    assert.strictEqual(result, undefined);
  });
});
