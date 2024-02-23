import * as vscode from "vscode";
import Sinon from "sinon";
import { DialogValues, OpenDialog } from "../../src";
import assert from "assert";
import path from "path";
import os from "os";

suite("OpenDialog tests", () => {
  let showOpenDialogStub: Sinon.SinonStub;

  /**
   * Creates the necessary stubs before each test.
   */
  setup("create stubs", () => {
    showOpenDialogStub = Sinon.stub(vscode.window, "showOpenDialog");
  });

  /**
   * Restore all the stubs after each test.
   */
  teardown("restore", () => {
    showOpenDialogStub.restore();
  });

  /**
   * Tests that an automatic title is created for a file selection.
   */
  test("should create correct title when no option given (file selection)", async () => {
    showOpenDialogStub.resolves(undefined);

    const openDialog = new OpenDialog({});

    const result = await openDialog.showDialog(new DialogValues(), 2, 4);

    assert.strictEqual(undefined, result);

    Sinon.assert.calledOnce(showOpenDialogStub);
    Sinon.assert.calledWithExactly(showOpenDialogStub, { title: "Select a File (Step 2 of 4)" });
  });

  /**
   * Tests that an automatic title is created for a folder selection.
   */
  test("should create correct title when no option given (folder selection)", async () => {
    showOpenDialogStub.resolves(undefined);

    const openDialog = new OpenDialog({ canSelectFolders: true });

    const result = await openDialog.showDialog(new DialogValues(), 2, 4);

    assert.strictEqual(undefined, result);

    Sinon.assert.calledOnce(showOpenDialogStub);
    Sinon.assert.calledWithExactly(showOpenDialogStub, {
      title: "Select a Directory (Step 2 of 4)",
      canSelectFolders: true,
    });
  });

  /**
   * Tests that an exiting title is correctly used.
   */
  test("should use existing title", async () => {
    showOpenDialogStub.resolves([]);

    const openDialog = new OpenDialog({ title: "my title" });

    const result = await openDialog.showDialog(new DialogValues(), 2, 4);

    assert.strictEqual(undefined, result);

    Sinon.assert.calledOnce(showOpenDialogStub);
    Sinon.assert.calledWithExactly(showOpenDialogStub, {
      title: "my title (Step 2 of 4)",
    });
  });
  /**
   * Tests that other options are preserved correctly.
   */
  test("should preserve options", async () => {
    showOpenDialogStub.resolves([]);

    const openDialog = new OpenDialog({
      title: "my title",
      canSelectFiles: true,
      canSelectFolders: true,
      canSelectMany: true,
      defaultUri: vscode.Uri.parse("a"),
      filters: {
        Images: ["png", "jpg"],
      },
      openLabel: "My open button",
    });

    const result = await openDialog.showDialog(new DialogValues(), 2, 4);

    assert.strictEqual(undefined, result);

    Sinon.assert.calledOnce(showOpenDialogStub);
    Sinon.assert.calledWithExactly(showOpenDialogStub, {
      title: "my title (Step 2 of 4)",
      canSelectFiles: true,
      canSelectFolders: true,
      canSelectMany: true,
      defaultUri: vscode.Uri.parse("a"),
      filters: {
        Images: ["png", "jpg"],
      },
      openLabel: "My open button",
    });
  });

  /**
   * Tests that a single input value is handled correctly.
   */
  test("should handle single input value", async () => {
    const uri = vscode.Uri.file("a");

    showOpenDialogStub.resolves([uri]);

    const openDialog = new OpenDialog({ title: "my title" });

    const result = await openDialog.showDialog(new DialogValues(), 2, 4);

    assert.ok(result);
    assert.deepStrictEqual([uri.fsPath], result);

    Sinon.assert.calledOnce(showOpenDialogStub);
    Sinon.assert.calledWithExactly(showOpenDialogStub, {
      title: "my title (Step 2 of 4)",
    });
  });
  /**
   * Tests that multiple input values are handled correctly.
   */
  test("should handle multiple input value", async () => {
    const uriA = vscode.Uri.file("a");
    const uriB = vscode.Uri.file("b");
    const uriC = vscode.Uri.file("c");

    showOpenDialogStub.resolves([uriA, uriB, uriC]);

    const openDialog = new OpenDialog({ title: "my title" });

    const result = await openDialog.showDialog(new DialogValues(), 2, 4);

    assert.ok(result);
    assert.deepStrictEqual([uriA.fsPath, uriB.fsPath, uriC.fsPath], result);

    Sinon.assert.calledOnce(showOpenDialogStub);
    Sinon.assert.calledWithExactly(showOpenDialogStub, {
      title: "my title (Step 2 of 4)",
    });
  });
});
