import Sinon from "sinon";
import { DialogValues, InputAction, QuickPick } from "../../src";
import * as vscode from "vscode";
import assert from "assert";
import { QuickPickItems } from "../../src/type/quickPick/GenericQuickPick";

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
   * Tests that a given value for the name will be inputted into the value of the element.
   */
  test("should take old value", async () => {
    const value = "item2";

    const dialogValues = new DialogValues();
    dialogValues.addValue("quickPick", [value]);

    const quickPick = new QuickPick({ ...basicOptions, allowMultiple: true, generateItems: () => quickPickItems });

    await showDialogAndAssert([value], quickPick, 2, dialogValues);

    assertItem2WasSelected(quickPickWithAccept);
  });

  /**
   * Tests that a given value for the name will be not inputted into the value of the element, when `allowMultiple` is set to false.
   */
  test("should not take old value when only allow multiple is not set", async () => {
    const name = "Unit";
    const value = "item2";

    const dialogValues = new DialogValues();
    dialogValues.addValue(name, [value]);

    const quickPick = new QuickPick({ ...basicOptions, allowMultiple: false, generateItems: () => quickPickItems });

    await showDialogAndAssert([], quickPick, 2, dialogValues);

    assert.deepStrictEqual(quickPickWithAccept.selectedItems, []);
  });

  /**
   * Tests that the picked selection from the generated items will be still there.
   */
  test("should preserve picked items the generated items", async () => {
    const quickPick = new QuickPick({
      ...basicOptions,
      allowMultiple: true,
      generateItems: () => [
        { label: "item1", description: "description1", detail: "detail1" },
        { label: "item2", description: "description2", detail: "detail2", picked: true },
        { label: "item3", description: "description3", detail: "detail3" },
      ],
    });

    await showDialogAndAssert(["item2"], quickPick);

    assertItem2WasSelected(quickPickWithAccept);
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
      generateItems: () =>
        quickPickItems.map((pItem) => {
          return { ...pItem, picked: false };
        }),
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
    const expectedLabel = "selected item";

    const quickPick = new QuickPick({
      ...basicOptions,
      generateItems: () => [
        { label: expectedLabel, description: "My description", detail: "My detail", picked: true },
        ...quickPickItems.map((pItem) => {
          return { ...pItem, picked: false };
        }),
      ],
      allowMultiple: true,
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
      generateItems: () => [
        ...quickPickItems.map((pItem) => {
          return { ...pItem, picked: true };
        }),
      ],
      allowMultiple: true,
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

  /**
   * Tests that a given placeholder will be used correctly.
   */
  test("should use placeholder correctly", async () => {
    const placeholder = "Lorem ipsum";

    const quickPick = new QuickPick({
      ...basicOptions,
      placeholder: placeholder,
      generateItems: () => [
        ...quickPickItems.map((pItem) => {
          return { ...pItem, picked: true };
        }),
      ],
      allowMultiple: true,
    });

    await showDialogAndAssert(["item1", "item2", "item3"], quickPick);

    assert.strictEqual(quickPickWithAccept.placeholder, placeholder, "placeholder ");
  });
});

/**
 * Asserts that `item2` is the selected item and that the items contains `item1`, `item2` (picked), and `item3`.
 * @param quickPickWithAccept - the quickPick that should be checked
 */
function assertItem2WasSelected(quickPickWithAccept: vscode.QuickPick<vscode.QuickPickItem>) {
  assert.deepStrictEqual(
    quickPickWithAccept.selectedItems,
    [{ label: "item2", description: "description2", detail: "detail2", picked: true }] as vscode.QuickPickItem[],
    "selected items"
  );
  assert.deepStrictEqual(
    quickPickWithAccept.items,
    [
      { label: "item1", description: "description1", detail: "detail1" },
      { label: "item2", description: "description2", detail: "detail2", picked: true },
      { label: "item3", description: "description3", detail: "detail3" },
    ] as vscode.QuickPickItem[],
    "items"
  );
}

/**
 * Shows the dialog and asserts the result of the dialog.
 * @param expected - the expected result of the dialog
 * @param quickPick - the quick pick that should be used for showing the dialog
 * @param currentStep - the current step of the dialog
 * @param dialogValues - the current values of the dialog
 */
async function showDialogAndAssert(
  expected: string[] | InputAction.BACK | undefined,
  quickPick: QuickPick,
  currentStep: number = 2,
  dialogValues: DialogValues = new DialogValues()
) {
  const result = await quickPick.showDialog(dialogValues, currentStep, 4);

  assert.deepStrictEqual(expected, result);
}
