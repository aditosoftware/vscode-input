import Sinon from "sinon";
import { DialogValues, QuickPick } from "../../src";
import * as vscode from "vscode";
import assert from "assert";
import { QuickPickItems } from "../../src/type/quickPick/GenericQuickPick";

suite("QuickPick tests", () => {
  /**
   * Some items that can be returned by `generateItems`.
   */
  const quickPickItems: vscode.QuickPickItem[] = [
    { label: "item1", description: "description1", detail: "detail1" },
    { label: "item2", description: "description2", detail: "detail2" },
    { label: "item3", description: "description3", detail: "detail3" },
  ];

  /**
   * Some basic options that apply for every quick pick.
   */
  const basicOptions = {
    name: "quickPick",
    title: "My Title",
  };

  /**
   * The stub for `showQuickPick` of vscode.
   */
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
    const quickPick = new QuickPick({ ...basicOptions, generateItems: () => quickPickItems });

    showQuickPickStub.resolves(undefined);

    await showDialogAndAssert(undefined, quickPick);

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
    const quickPick = new QuickPick({
      ...basicOptions,
      generateItems: () => quickPickItems,
      allowMultiple: true,
    });

    showQuickPickStub.resolves(undefined);

    await showDialogAndAssert(undefined, quickPick);

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

    const quickPick = new QuickPick({ ...basicOptions, generateItems: async () => items });

    showQuickPickStub.resolves(undefined);

    await showDialogAndAssert(undefined, quickPick);

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
    const quickPick = new QuickPick({
      ...basicOptions,
      generateItems: () => quickPickItems,
      allowMultiple: true,
    });

    const expectedLabel = "selected item";
    showQuickPickStub.resolves({ label: expectedLabel, description: "My description", detail: "My detail" });

    await showDialogAndAssert([expectedLabel], quickPick);

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
    const quickPick = new QuickPick({
      ...basicOptions,
      generateItems: () => [],
      allowMultiple: true,
    });

    showQuickPickStub.resolves(quickPickItems);

    await showDialogAndAssert(["item1", "item2", "item3"], quickPick);

    Sinon.assert.calledWithExactly(showQuickPickStub, [], {
      title: "My Title - (Step 2 of 4)",
      canPickMany: true,
      placeHolder: "Select any number of items",
    });
  });

  /**
   * Tests that a given placeholder will be used correctly.
   */
  test("should use placeholder correctly", async () => {
    const placeholder = "Lorem ipsum";

    const quickPick = new QuickPick({
      ...basicOptions,
      placeholder: placeholder,
      generateItems: () => [],
    });

    showQuickPickStub.resolves(quickPickItems);

    await showDialogAndAssert(["item1", "item2", "item3"], quickPick);

    Sinon.assert.calledWithExactly(showQuickPickStub, [], {
      title: "My Title - (Step 2 of 4)",
      canPickMany: undefined,
      placeHolder: placeholder,
    });
  });
});

/**
 * Shows the dialog and asserts the result of the dialog.
 *
 * @param expected - the expected result of the dialog
 * @param quickPick - the quick pick that should be used for showing the dialog
 */
async function showDialogAndAssert(expected: string[] | undefined, quickPick: QuickPick): Promise<void> {
  const result = await quickPick.showDialog(new DialogValues(), 2, 4);

  assert.deepStrictEqual(expected, result);
}
