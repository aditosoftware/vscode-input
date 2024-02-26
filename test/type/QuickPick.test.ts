import Sinon from "sinon";
import { DialogValues, QuickPick, QuickPickItems } from "../../src";
import * as vscode from "vscode";
import assert from "assert";

suite("QuickPick tests", () => {
  const quickPickItems: vscode.QuickPickItem[] = [
    { label: "item1", description: "description1", detail: "detail1" },
    { label: "item2", description: "description2", detail: "detail2" },
    { label: "item3", description: "description3", detail: "detail3" },
  ];

  let showQuickPickStub: Sinon.SinonStub;

  /**
   * Creates the necessary stubs before each test.
   */
  setup("create stubs", () => {
    showQuickPickStub = Sinon.stub(vscode.window, "showQuickPick");
  });

  /**
   * Restore all the stubs after each test.
   */
  teardown("restore", () => {
    showQuickPickStub.restore();
  });

  /**
   * Checks if a correct title was created when `allowMultiple` was not set.
   */
  test("should create correct title (no allowMultiple)", async () => {
    const quickPick = new QuickPick("quickPick", "My Title", () => quickPickItems);

    showQuickPickStub.resolves(undefined);

    const result = await quickPick.showDialog(new DialogValues(), 2, 4);

    assert.strictEqual(undefined, result);

    Sinon.assert.calledOnce(showQuickPickStub);
    Sinon.assert.calledWithExactly(showQuickPickStub, quickPickItems, {
      title: "My Title - (Step 2 of 4)",
      canPickMany: undefined,
      placeHolder: "Select one item",
    });
  });

  /**
   * Checks if a correct title was created when `allowMultiple` was set to `true`.
   */
  test("should create correct title (allowMultiple to true)", async () => {
    const quickPick = new QuickPick("quickPick", "My Title", () => quickPickItems, true);

    showQuickPickStub.resolves(undefined);

    const result = await quickPick.showDialog(new DialogValues(), 2, 4);

    assert.strictEqual(undefined, result);

    Sinon.assert.calledOnce(showQuickPickStub);
    Sinon.assert.calledWithExactly(showQuickPickStub, quickPickItems, {
      title: "My Title - (Step 2 of 4)",
      canPickMany: true,
      placeHolder: "Select any number of items",
    });
  });

  /**
   * Checks if a correct title was created when the loaded items has an additional title given.
   */
  test("should create correct title with additional title", async () => {
    const items: QuickPickItems = {
      items: quickPickItems,
      additionalTitle: "My additional title",
    };

    const quickPick = new QuickPick("quickPick", "My Title", async () => items);

    showQuickPickStub.resolves(undefined);

    const result = await quickPick.showDialog(new DialogValues(), 2, 4);

    assert.strictEqual(undefined, result);

    Sinon.assert.calledOnce(showQuickPickStub);
    Sinon.assert.calledWithExactly(showQuickPickStub, quickPickItems, {
      title: "My Title (My additional title) - (Step 2 of 4)",
      canPickMany: undefined,
      placeHolder: "Select one item",
    });
  });

  /**
   * Tests that a single item was correctly selected
   */
  test("should correctly handle single selection", async () => {
    const quickPick = new QuickPick("quickPick", "My Title", () => quickPickItems, true);

    const expectedLabel = "selected item";
    showQuickPickStub.resolves({ label: expectedLabel, description: "My description", detail: "My detail" });

    const result = await quickPick.showDialog(new DialogValues(), 2, 4);

    assert.deepStrictEqual([expectedLabel], result);

    Sinon.assert.calledOnce(showQuickPickStub);
    Sinon.assert.calledWithExactly(showQuickPickStub, quickPickItems, {
      title: "My Title - (Step 2 of 4)",
      canPickMany: true,
      placeHolder: "Select any number of items",
    });
  });

  /**
   * Tests that multiple items were correctly selected.
   */
  test("should correctly handle multiple selection", async () => {
    const quickPick = new QuickPick("quickPick", "My Title", () => [], true);

    showQuickPickStub.resolves(quickPickItems);

    const result = await quickPick.showDialog(new DialogValues(), 2, 4);

    assert.deepStrictEqual(["item1", "item2", "item3"], result);

    Sinon.assert.calledOnce(showQuickPickStub);
    Sinon.assert.calledWithExactly(showQuickPickStub, [], {
      title: "My Title - (Step 2 of 4)",
      canPickMany: true,
      placeHolder: "Select any number of items",
    });
  });
});
