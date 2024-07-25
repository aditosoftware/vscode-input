import Sinon from "sinon";
import { DialogValues, InputAction, QuickPick } from "../../src";
import * as vscode from "vscode";
import assert from "assert";
import { QuickPickItems } from "../../src/type/quickPick/GenericQuickPick";

/**
 * Tests for QuickPicks.
 */
suite("QuickPick tests", () => {
  const title = "My Title";
  const placeHolder = "My placeholder";

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
    placeHolder,
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

    await showDialogAndAssert([value], quickPick, title, true, dialogValues);

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

    await showDialogAndAssert([], quickPick, title, true, dialogValues);

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

    await showDialogAndAssert(["item2"], quickPick, title);

    assertItem2WasSelected(quickPickWithAccept);
  });

  /**
   * Checks if the placeHolder given was used and no created placeHolder.
   */
  test("should uses placeHolder correctly", async () => {
    const quickPick = new QuickPick({ ...basicOptions, generateItems: () => quickPickItems });

    await showDialogAndAssert([], quickPick, title);

    assert.strictEqual(quickPickWithAccept.title, title);
    assert.strictEqual(quickPickWithAccept.canSelectMany, false, "canSelectMany ");
    assert.strictEqual(quickPickWithAccept.placeholder, placeHolder, "placeholder ");
  });

  /**
   * Checks if a correct placeHolder was created when the loaded items has an additional placeHolder given.
   */
  test("should create correct placeHolder with additional placeHolder", async () => {
    const additionalPlaceholder = "My additional placeHolder";
    const items: QuickPickItems = {
      items: quickPickItems,
      additionalPlaceholder,
    };

    const quickPick = new QuickPick({ ...basicOptions, generateItems: async () => items });

    await showDialogAndAssert([], quickPick, title);

    assert.strictEqual(quickPickWithAccept.title, title, "title");
    assert.strictEqual(quickPickWithAccept.canSelectMany, false, "canSelectMany ");
    assert.strictEqual(quickPickWithAccept.placeholder, `${placeHolder} (${additionalPlaceholder})`, "placeholder ");
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

    await showDialogAndAssert([expectedLabel], quickPick, title);

    assert.strictEqual(quickPickWithAccept.title, title, "title");
    assert.strictEqual(quickPickWithAccept.canSelectMany, true, "canSelectMany ");
    assert.strictEqual(quickPickWithAccept.placeholder, placeHolder, "placeholder ");
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

    await showDialogAndAssert(["item1", "item2", "item3"], quickPick, title);

    assert.strictEqual(quickPickWithAccept.title, title, "title");
    assert.strictEqual(quickPickWithAccept.canSelectMany, true, "canSelectMany ");
    assert.strictEqual(quickPickWithAccept.placeholder, placeHolder, "placeholder ");
  });

  /**
   * Tests that no back button should be there, when it is the first step.
   */
  test("should not have back button on first step", async () => {
    const quickPick = new QuickPick({ ...basicOptions, generateItems: () => [] });

    await showDialogAndAssert([], quickPick, title, false);

    assert.deepStrictEqual(quickPickWithAccept.buttons, []);
  });

  /**
   * Tests that there should be a back button, when is is not the first step.
   */
  test("should have back button", async () => {
    const quickPick = new QuickPick({ ...basicOptions, generateItems: () => [] });

    await showDialogAndAssert([], quickPick, title, true);

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

    await showDialogAndAssert(InputAction.BACK, quickPick, title, true);

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

    await showDialogAndAssert(undefined, quickPick, title);
  });

  [
    { ignoreFocusOut: undefined, expected: false },
    { ignoreFocusOut: false, expected: false },
    { ignoreFocusOut: true, expected: true },
  ].forEach((pArgument) => {
    /**
     * Tests that a given ignoreFocusOut will be used correctly.
     */
    test(`should use ignoreFocusOut correctly for given value ${pArgument.ignoreFocusOut}`, async () => {
      const quickPick = new QuickPick({
        ...basicOptions,
        ignoreFocusOut: pArgument.ignoreFocusOut,
        generateItems: () => [
          ...quickPickItems.map((pItem) => {
            return { ...pItem, picked: true };
          }),
        ],
        allowMultiple: true,
      });

      await showDialogAndAssert(["item1", "item2", "item3"], quickPick, title);

      assert.strictEqual(quickPickWithAccept.ignoreFocusOut, pArgument.expected, "ignoreFocusOut");
    });
  });

  [
    { allowMultiple: undefined, expected: false },
    { allowMultiple: false, expected: false },
    { allowMultiple: true, expected: true },
  ].forEach((pArgument) => {
    /**
     * Tests that a given allowMultiple will be used correctly.
     */
    test(`should use allowMultiple correctly for given value ${pArgument.allowMultiple}`, async () => {
      const quickPick = new QuickPick({
        ...basicOptions,
        allowMultiple: pArgument.allowMultiple,
        generateItems: () => [],
      });

      await showDialogAndAssert([], quickPick, title);

      assert.strictEqual(quickPickWithAccept.canSelectMany, pArgument.expected, "allowMultiple");
    });
  });
});

/**
 * Asserts that `item2` is the selected item and that the items contains `item1`, `item2` (picked), and `item3`.
 *
 * @param quickPickWithAccept - the quickPick that should be checked
 */
function assertItem2WasSelected(quickPickWithAccept: vscode.QuickPick<vscode.QuickPickItem>): void {
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
 *
 * @param expected - the expected result of the dialog
 * @param quickPick - the quick pick that should be used for showing the dialog
 * @param title - the title of all dialogs
 * @param showBackButton - if the back button should be shown
 * @param dialogValues - the current values of the dialog
 */
async function showDialogAndAssert(
  expected: string[] | InputAction.BACK | undefined,
  quickPick: QuickPick,
  title: string,
  showBackButton: boolean = true,
  dialogValues: DialogValues = new DialogValues()
): Promise<void> {
  const result = await quickPick.showDialog(dialogValues, title, showBackButton);

  assert.deepStrictEqual(expected, result);
}
