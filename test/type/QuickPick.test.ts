import Sinon from "sinon";
import { DialogValues, InputAction, QuickPick } from "../../src";
import * as vscode from "vscode";
import assert from "assert";
import { QuickPickItems } from "../../src/type/quickPick/GenericQuickPick";

// FIXME items prüfen!

/**
 * Tests for QuickPicks.
 */
suite("QuickPick tests", () => {
  const normalQuickPick: vscode.QuickPick<vscode.QuickPickItem> = vscode.window.createQuickPick();

  /**
   * The quick pick element with an dummy `onDidAccept` answer.
   */
  let quickPickWithAccept: vscode.QuickPick<vscode.QuickPickItem>;

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
  let createQuickPick: Sinon.SinonStub;

  /**
   * Creates the necessary stubs before each test.
   */
  setup("create stubs", () => {
    // copies the normal quick pick to add an dummy onDidAccept function that will trigger.
    const copyElementWithAccept = Object.create(normalQuickPick);
    copyElementWithAccept.onDidAccept = (callback: () => void) => callback();
    // and transforms this any element back to an vscode.QuickPick, so it can be returned by createQuickPick
    quickPickWithAccept = copyElementWithAccept as vscode.QuickPick<vscode.QuickPickItem>;

    createQuickPick = Sinon.stub(vscode.window, "createQuickPick").returns(quickPickWithAccept);
  });

  /**
   * Restore all the stubs after each test.
   */
  teardown("restore", () => {
    Sinon.restore();
  });

  /**
   * Checks if a correct title was created when `allowMultiple` was not set.
   */
  test("should create correct title (no allowMultiple)", async () => {
    const quickPick = new QuickPick({ ...basicOptions, generateItems: () => quickPickItems });

    await showDialogAndAssert([], quickPick);

    assert.strictEqual(quickPickWithAccept.title, "My Title - (Step 2 of 4)", "title");
    assert.strictEqual(quickPickWithAccept.canSelectMany, false, "canSelectMany ");
    assert.strictEqual(quickPickWithAccept.placeholder, "Select one item", "placeholder ");
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

    await showDialogAndAssert([], quickPick);

    assert.strictEqual(quickPickWithAccept.title, "My Title - (Step 2 of 4)", "title");
    assert.strictEqual(quickPickWithAccept.canSelectMany, true, "canSelectMany ");
    assert.strictEqual(quickPickWithAccept.placeholder, "Select any number of items", "placeholder ");
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

    await showDialogAndAssert([], quickPick);

    assert.strictEqual(quickPickWithAccept.title, "My Title (My additional title) - (Step 2 of 4)", "title");
    assert.strictEqual(quickPickWithAccept.canSelectMany, false, "canSelectMany ");
    assert.strictEqual(quickPickWithAccept.placeholder, "Select one item", "placeholder ");
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

    Sinon.stub(quickPickWithAccept, "selectedItems").get(() => {
      return [{ label: expectedLabel, description: "My description", detail: "My detail" }];
    });

    await showDialogAndAssert([expectedLabel], quickPick);

    assert.strictEqual(quickPickWithAccept.title, "My Title - (Step 2 of 4)", "title");
    assert.strictEqual(quickPickWithAccept.canSelectMany, true, "canSelectMany ");
    assert.strictEqual(quickPickWithAccept.placeholder, "Select any number of items", "placeholder ");
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

    Sinon.stub(quickPickWithAccept, "selectedItems").get(() => {
      return quickPickItems;
    });

    await showDialogAndAssert(["item1", "item2", "item3"], quickPick);

    assert.strictEqual(quickPickWithAccept.title, "My Title - (Step 2 of 4)", "title");
    assert.strictEqual(quickPickWithAccept.canSelectMany, true, "canSelectMany ");
    assert.strictEqual(quickPickWithAccept.placeholder, "Select any number of items", "placeholder ");
  });

  /**
   * Tests that no back button should be there, when it is the first step.
   */
  test("should not have back button on first step", async () => {
    const quickPick = new QuickPick({ ...basicOptions, generateItems: () => [] });

    await showDialogAndAssert([], quickPick, 1);

    assert.deepStrictEqual(quickPickWithAccept.buttons, []);
  });

  /**
   * Tests that there should be a back button, when is is not the first step.
   */
  test("should have back button", async () => {
    const quickPick = new QuickPick({ ...basicOptions, generateItems: () => [] });

    await showDialogAndAssert([], quickPick, 2);

    assert.deepStrictEqual(quickPickWithAccept.buttons, [vscode.QuickInputButtons.Back]);
  });

  /**
   * Tests that the back button will be triggered correctly.
   */
  test("should correctly trigger back button", async () => {
    const copyElementWithBackButtonTrigger = Object.create(normalQuickPick);
    copyElementWithBackButtonTrigger.onDidTriggerButton = (callback: (button: vscode.QuickInputButton) => void) =>
      callback(vscode.QuickInputButtons.Back);
    const quickPickWithOnTriggerBackButton = copyElementWithBackButtonTrigger as vscode.QuickPick<vscode.QuickPickItem>;

    createQuickPick.returns(quickPickWithOnTriggerBackButton);

    const quickPick = new QuickPick({ ...basicOptions, generateItems: () => [] });

    await showDialogAndAssert(InputAction.BACK, quickPick, 2);

    assert.deepStrictEqual(quickPickWithOnTriggerBackButton.buttons, [vscode.QuickInputButtons.Back]);
  });

  /**
   * Tests that the onHide will be triggered correctly.
   */
  test("should correctly trigger on hide", async () => {
    const copyElementWithHide = Object.create(normalQuickPick);
    copyElementWithHide.onDidHide = (callback: () => void) => callback();
    const quickPickWithHide = copyElementWithHide as vscode.QuickPick<vscode.QuickPickItem>;

    createQuickPick.returns(quickPickWithHide);

    const quickPick = new QuickPick({ ...basicOptions, generateItems: () => [] });

    await showDialogAndAssert(undefined, quickPick);
  });
});

/**
 * Shows the dialog and asserts the result of the dialog.
 * @param expected - the expected result of the dialog
 * @param quickPick - the quick pick that should be used for showing the dialog
 * @param currentStep - the current step of the dialog
 */
async function showDialogAndAssert(
  expected: string[] | InputAction.BACK | undefined,
  quickPick: QuickPick,
  currentStep: number = 2
) {
  const result = await quickPick.showDialog(new DialogValues(), currentStep, 4);

  assert.deepStrictEqual(expected, result);
}
