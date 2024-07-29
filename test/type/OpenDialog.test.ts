import * as vscode from "vscode";
import Sinon from "sinon";
import { DialogValues, OpenDialog } from "../../src";
import assert from "assert";
import path from "path";

/**
 * Tests for the OpenDialog.
 */
suite("OpenDialog tests", () => {
  const title = "My title";
  const openLabel = "Select this";

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
   * Tests that a given value for the name will be inputted into the value of the element when a file selection is there.
   */
  test("should take old value for file selection", async () => {
    const name = "openDialog";
    const value = vscode.Uri.file(path.join(process.cwd(), "my", "uri", "for", "selection").toLowerCase());

    const dialogValues = new DialogValues();
    dialogValues.addValue(name, value.fsPath);

    showOpenDialogStub.resolves(undefined);

    const openDialog = new OpenDialog({ name, openDialogOptions: { canSelectFiles: true, openLabel } });

    await openDialog.showDialog(dialogValues, title);

    // check that the fsPath is identical in both urls
    const args = showOpenDialogStub.args[0][0];
    assert.deepStrictEqual(args.defaultUri.fsPath, value.fsPath);

    Sinon.assert.calledWithExactly(showOpenDialogStub, {
      canSelectFiles: true,
      title,
      openLabel,
      defaultUri: value,
    });
  });

  /**
   * Tests that a given value for the name will be inputted into the value of the element when a folder selection is there.
   */
  test("should take old value for folder selection", async () => {
    const name = "openDialog";
    const value = vscode.Uri.file(path.join(process.cwd(), "my", "uri", "for", "selection").toLowerCase());

    const dialogValues = new DialogValues();
    dialogValues.addValue(name, value.fsPath);

    showOpenDialogStub.resolves(undefined);

    const openDialog = new OpenDialog({
      name,
      openDialogOptions: { openLabel, canSelectFiles: false, canSelectFolders: true },
    });

    await openDialog.showDialog(dialogValues, title);

    // check that the fsPath is identical in both urls
    const args = showOpenDialogStub.args[0][0];
    assert.deepStrictEqual(args.defaultUri.fsPath, value.fsPath);

    Sinon.assert.calledWithExactly(showOpenDialogStub, {
      title,
      openLabel,
      defaultUri: value,
      canSelectFiles: false,
      canSelectFolders: true,
    });
  });

  /**
   * Tests that a given value for the name will be inputted into the value of the element when multiple elements are selected.
   */
  test("should take old value for multiple selection", async () => {
    const name = "openDialog";
    const value = vscode.Uri.file(path.join(process.cwd(), "my", "uri", "for", "selection").toLowerCase());

    const dialogValues = new DialogValues();
    dialogValues.addValue(name, [
      vscode.Uri.file(path.join(process.cwd(), "my", "uri", "for", "selection", "someSubelement").toLowerCase()).fsPath,
      vscode.Uri.file(path.join(process.cwd(), "my", "uri", "for", "selection", "anotherSubelement").toLowerCase())
        .fsPath,
      vscode.Uri.file(path.join(process.cwd(), "my", "uri", "for", "selection", "thirdSubelement").toLowerCase())
        .fsPath,
    ]);

    showOpenDialogStub.resolves(undefined);

    const openDialog = new OpenDialog({
      name,
      openDialogOptions: { openLabel, canSelectFiles: true, canSelectMany: true },
    });

    await openDialog.showDialog(dialogValues, title);

    Sinon.assert.calledWithExactly(showOpenDialogStub, {
      title,
      openLabel,
      defaultUri: value,
      canSelectFiles: true,
      canSelectMany: true,
    });
  });

  /**
   * Tests that the passed title is used.
   */
  test("should use passed title", async () => {
    showOpenDialogStub.resolves(undefined);

    const openDialog = new OpenDialog({ name: "openDialog", openDialogOptions: { openLabel } });

    const result = await openDialog.showDialog(new DialogValues(), title);

    assert.strictEqual(undefined, result);

    Sinon.assert.calledOnce(showOpenDialogStub);
    Sinon.assert.calledWithExactly(showOpenDialogStub, { title, openLabel });
  });

  /**
   * Tests that other options are preserved correctly.
   */
  test("should preserve options", async () => {
    showOpenDialogStub.resolves([]);

    const openDialog = new OpenDialog({
      name: "openDialog",
      openDialogOptions: {
        canSelectFiles: true,
        canSelectFolders: true,
        canSelectMany: true,
        defaultUri: vscode.Uri.parse("a"),
        filters: {
          Images: ["png", "jpg"],
        },
        openLabel: "My open button",
      },
    });

    const result = await openDialog.showDialog(new DialogValues(), title);

    assert.strictEqual(undefined, result);

    Sinon.assert.calledOnce(showOpenDialogStub);
    Sinon.assert.calledWithExactly(showOpenDialogStub, {
      title,
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

    const openDialog = new OpenDialog({ name: "openDialog", openDialogOptions: { openLabel } });

    const result = await openDialog.showDialog(new DialogValues(), title);

    assert.ok(result);
    assert.deepStrictEqual([uri.fsPath], result);

    Sinon.assert.calledOnce(showOpenDialogStub);
    Sinon.assert.calledWithExactly(showOpenDialogStub, { title, openLabel });
  });

  /**
   * Tests that multiple input values are handled correctly.
   */
  test("should handle multiple input value", async () => {
    const uriA = vscode.Uri.file("a");
    const uriB = vscode.Uri.file("b");
    const uriC = vscode.Uri.file("c");

    showOpenDialogStub.resolves([uriA, uriB, uriC]);

    const openDialog = new OpenDialog({ name: "openDialog", openDialogOptions: { openLabel } });

    const result = await openDialog.showDialog(new DialogValues(), title);

    assert.ok(result);
    assert.deepStrictEqual([uriA.fsPath, uriB.fsPath, uriC.fsPath], result);

    Sinon.assert.calledOnce(showOpenDialogStub);
    Sinon.assert.calledWithExactly(showOpenDialogStub, { title, openLabel });
  });
});
