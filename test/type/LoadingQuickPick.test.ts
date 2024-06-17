import Sinon from "sinon";
import * as vscode from "vscode";
import { DialogValues, LoadingQuickPick, initializeLogger } from "../../src";
import assert from "assert";
import { Logger } from "@aditosoftware/vscode-logging";
import path from "path";
import os from "os";

/**
 * Tests the loading quick pick.
 */
suite("LoadingQuickPick tests", () => {
  /**
   * The stub for creating any quick picks.
   * You need to give the created quick pick with the `returns` function.
   */
  let createQuickPick: sinon.SinonStub;

  /**
   * The quick pick element with an dummy `onDidAccept` answer.
   */
  let quickPickWithAccept: vscode.QuickPick<vscode.QuickPickItem>;

  /**
   * The quick pick element with an dummy `onDidHide` answer.
   */
  let quickPickWithHide: vscode.QuickPick<vscode.QuickPickItem>;

  /**
   * Creates the necessary stubs before each test.
   */
  setup("create stubs", () => {
    const quickPick: vscode.QuickPick<vscode.QuickPickItem> = vscode.window.createQuickPick();

    // copies the normal quick pick to add an dummy onDidAccept function that will trigger.
    const copyElementWithAccept = Object.create(quickPick);
    copyElementWithAccept.onDidAccept = (callback: () => void) => callback();
    // and transforms this any element back to an vscode.QuickPick, so it can be returned by createQuickPick
    quickPickWithAccept = copyElementWithAccept as vscode.QuickPick<vscode.QuickPickItem>;

    // copies the normal quick again to add an dummy onDidHide function that will trigger.
    // this can not be the same element because otherwise onDidAccept will trigger first
    const copyElementWithHide = Object.create(quickPick);
    copyElementWithHide.onDidHide = (callback: () => void) => callback();
    // and transforms this any element back to an vscode.QuickPick, so it can be returned by createQuickPick
    quickPickWithHide = copyElementWithHide as vscode.QuickPick<vscode.QuickPickItem>;

    createQuickPick = Sinon.stub(vscode.window, "createQuickPick");
  });

  /**
   * Restore all the stubs after each test.
   */
  teardown("restore", () => {
    createQuickPick.restore();
  });

  /**
   * Tests that the `onDidHide` will be handled correctly.
   */
  test("should handle hide correctly", async () => {
    createQuickPick.returns(quickPickWithHide);

    const loadingQuickPick = new LoadingQuickPick({
      name: "loadingQuickPick",
      title: "My title",
      loadingTitle: "My loading title",
      generateItems: () => [{ label: "normal item" }],
      reloadItems: () => [{ label: "reload item" }],
      reloadTooltip: "my reload tooltip",
      allowMultiple: true,
    });

    const result = await loadingQuickPick.showDialog(new DialogValues(), 2, 4);

    assert.deepStrictEqual(undefined, result);
  });

  /**
   * Tests that the `onDidAccept` will be handled correctly.
   */
  suite("should handle onDidAccept correctly", () => {
    /**
     * The clock for updating the times of an timeout.
     */
    let clock: Sinon.SinonFakeTimers;

    /**
     * A spy of the setter of the title of a quick pick. This can be used the check if the title was overwritten correctly.
     */
    let titleSet: PropertyDescriptor & {
      get: Sinon.SinonSpy<[], string | undefined>;
      set: Sinon.SinonSpy<[string | undefined], void>;
    };
    /**
     * A spy of the setter of the placeholder of a quick pick. This can be used the check if the placeholder was overwritten correctly.
     */
    let placeholderSet: PropertyDescriptor & {
      get: Sinon.SinonSpy<[], string | undefined>;
      set: Sinon.SinonSpy<[string | undefined], void>;
    };

    /**
     * A spy of the setter of the busy field of a quick pick. This can be used the check if busy was overwritten correctly.
     */
    let busySet: PropertyDescriptor & {
      get: Sinon.SinonSpy<[], boolean>;
      set: Sinon.SinonSpy<[boolean], void>;
    };

    /**
     * A spy of the setter of the enabled field of a quick pick. This can be used the check if enabled was overwritten correctly.
     */
    let enabledSet: PropertyDescriptor & {
      get: Sinon.SinonSpy<[], boolean>;
      set: Sinon.SinonSpy<[boolean], void>;
    };

    /**
     * A stub of the getter of the selected items of a quick pick. This is used to return some dummy selected items for `quickPickWithAccept`.
     * It is not needed to set those items by yourself, this will be done in the setup.
     */
    let getSelectedItems: Sinon.SinonStub;

    /**
     * The expected item that should be returned in `getSelectedItems`.
     * Note: `getSelectedItems` will return an array of `vscode.QuickPickItem` and these are the labels of those items.
     */
    const expectedItems = ["Item 1", "Item 2"];

    /**
     * Creates the necessary stubs before each test.
     */
    setup("initialize stubs", () => {
      // create a fake timer for setTimeout
      clock = Sinon.useFakeTimers();

      // add some spy to the set of some attributes in order to check if the values were correctly updated
      titleSet = Sinon.spy(quickPickWithAccept, "title", ["set"]);
      placeholderSet = Sinon.spy(quickPickWithAccept, "placeholder", ["set"]);
      busySet = Sinon.spy(quickPickWithAccept, "busy", ["set"]);
      enabledSet = Sinon.spy(quickPickWithAccept, "enabled", ["set"]);

      // return some dummy items when the selectedItems will be returned
      // if this selection will be changed, you need to update `expectedItems` as well
      getSelectedItems = Sinon.stub(quickPickWithAccept, "selectedItems").get(() => {
        return [
          { label: "Item 1", description: "Description 1", detail: "Detail 1" },
          { label: "Item 2", description: "Description 1", detail: "Detail 1" },
        ];
      });
    });

    /**
     * Restore all the stubs after each test.
     */
    teardown("restore", () => {
      titleSet.set.restore();
      placeholderSet.set.restore();
      busySet.set.restore();
      enabledSet.set.restore();

      getSelectedItems.restore();

      clock.restore();
    });

    /**
     * Tests that the input is created correctly when allowing multiple inputs.
     */
    test("should create correctly with allow multiple", async () => {
      createQuickPick.returns(quickPickWithAccept);

      const loadingQuickPick = new LoadingQuickPick({
        name: "loadingQuickPick",
        title: "My title",
        loadingTitle: "My loading title",
        generateItems: () => [{ label: "normal item" }],
        reloadItems: () => [{ label: "reload item" }],
        reloadTooltip: "my reload tooltip",
        allowMultiple: true,
      });

      await showAndAssert(loadingQuickPick, expectedItems, quickPickWithAccept);

      assert.strictEqual(true, quickPickWithAccept.canSelectMany, "canSelectMany");

      validateResults(false, titleSet, placeholderSet, busySet, enabledSet, "Select any number of items");
    });

    [
      {
        name: "with separate reload function",
        expected: "reload item",
        reloadItems: () => [{ label: "reload item" }],
      },
      {
        name: "without separate reload function",
        expected: "normal item",
        reloadItems: undefined,
      },
    ].forEach((pElement) => {
      /**
       * Validates that the reload is triggered normally.
       */
      test(`should trigger reload (${pElement.name})`, async () => {
        const selectOneItemPlaceholder = "Select one item";

        createQuickPick.returns(quickPickWithAccept);

        // create a dummy log instance for the logging
        const context: vscode.ExtensionContext = {
          subscriptions: [],
          logUri: vscode.Uri.file(path.join(os.tmpdir(), "input")),
        } as unknown as vscode.ExtensionContext;
        Logger.initializeLogger(context, "Input");
        // and initialize the logger from the input with the currently created logger
        initializeLogger(Logger.getLogger());

        const debugLog = Sinon.spy(Logger.getLogger(), "debug");

        // trigger method for reload button press
        const onDidTriggerButtonStub = Sinon.stub(quickPickWithAccept, "onDidTriggerButton");

        const loadingQuickPick = new LoadingQuickPick({
          name: "loadingQuickPick",
          title: "My title",
          loadingTitle: "My loading title",
          generateItems: () => [{ label: "normal item" }],
          reloadItems: pElement.reloadItems,
          reloadTooltip: "my reload tooltip",
        });

        await showAndAssert(loadingQuickPick, expectedItems, quickPickWithAccept);

        assert.strictEqual(false, quickPickWithAccept.canSelectMany, "canSelectMany");

        validateResults(false, titleSet, placeholderSet, busySet, enabledSet, selectOneItemPlaceholder);

        // Trigger the reload
        onDidTriggerButtonStub.callArgWith(0, quickPickWithAccept.buttons[0]);

        // advance the clock 2 ms, to trigger the callback in the setTimeout
        await clock.tickAsync(2);

        // assert that all loading was done
        validateResults(true, titleSet, placeholderSet, busySet, enabledSet, selectOneItemPlaceholder);

        // check that the reload was logged
        Sinon.assert.calledTwice(debugLog);
        Sinon.assert.callOrder(
          debugLog.withArgs({ message: "Reload triggered for My title" }),
          debugLog.withArgs({ message: "Reload done for My title" })
        );

        // assert that the reload item was loaded
        assert.strictEqual(
          pElement.expected,
          quickPickWithAccept.items.map((pItem) => pItem.label).join(""),
          "items after reload"
        );

        Sinon.assert.calledOnce(createQuickPick);

        debugLog.restore();
        onDidTriggerButtonStub.restore();
      });
    });
  });
});

/**
 * Shows the dialog of the quick pick and asserts that are some common values are set.
 *
 * @param loadingQuickPick - the loading quick pick that should be used for showing the dialog
 * @param expectedItems - the expected items that should be returned by the `showDialog` function
 * @param quickPickWithAccept - the quick pick that is used in the background. This is used here to check some values if they are set correctly.
 */
async function showAndAssert(
  loadingQuickPick: LoadingQuickPick,
  expectedItems: string[],
  quickPickWithAccept: vscode.QuickPick<vscode.QuickPickItem>
): Promise<void> {
  const result = await loadingQuickPick.showDialog(new DialogValues(), 2, 4);

  assert.deepStrictEqual(expectedItems, result);

  assert.strictEqual(true, quickPickWithAccept.ignoreFocusOut, "ignoreFocusOut");
  assert.deepStrictEqual(
    [
      {
        iconPath: new vscode.ThemeIcon("sync"),
        tooltip: "my reload tooltip",
      },
    ],
    quickPickWithAccept.buttons,
    "buttons"
  );

  assert.strictEqual("normal item", quickPickWithAccept.items.map((pItem) => pItem.label).join(""), "items");
}

/**
 * Asserts the calls (count and arguments) of various set elements of the quick pick.
 *
 * @param duplicate - if all the set call are done duplicate (e.g. after a reload)
 * @param titleSet - the spy of the title set
 * @param placeholderSet - the spy of the placeholder set
 * @param busySet - the spy of the busy set
 * @param enabledSet - the spy of the enabled set
 * @param placeholderMessage - the message that is used for the placeholder. This can be different, when using `allowMultiple`
 */
function validateResults(
  duplicate: boolean,
  titleSet: PropertyDescriptor & {
    get: Sinon.SinonSpy<[], string | undefined>;
    set: Sinon.SinonSpy<[string | undefined], void>;
  },
  placeholderSet: PropertyDescriptor & {
    get: Sinon.SinonSpy<[], string | undefined>;
    set: Sinon.SinonSpy<[string | undefined], void>;
  },
  busySet: PropertyDescriptor & { get: Sinon.SinonSpy<[], boolean>; set: Sinon.SinonSpy<[boolean], void> },
  enabledSet: PropertyDescriptor & { get: Sinon.SinonSpy<[], boolean>; set: Sinon.SinonSpy<[boolean], void> },
  placeholderMessage: string
): void {
  // general call count of every element
  const callCount = duplicate ? 4 : 2;

  // title asserts
  Sinon.assert.callCount(titleSet.set, callCount);
  const loadingTitle = titleSet.set.withArgs("My loading title - (Step 2 of 4)");
  const title = titleSet.set.withArgs("My title - (Step 2 of 4)");
  Sinon.assert.callOrder(...(duplicate ? [loadingTitle, title, loadingTitle, title] : [loadingTitle, title]));

  // placeholder asserts
  Sinon.assert.callCount(placeholderSet.set, callCount);
  const loadingPlaceholder = placeholderSet.set.withArgs(
    "Please wait, loading is in progress. This might take a while."
  );
  const placeholder = placeholderSet.set.withArgs(placeholderMessage);
  Sinon.assert.callOrder(
    ...(duplicate
      ? [loadingPlaceholder, placeholder, loadingPlaceholder, placeholder]
      : [loadingPlaceholder, placeholder])
  );

  // busy asserts
  Sinon.assert.callCount(busySet.set, callCount);
  const busyTrue = busySet.set.withArgs(true);
  const busyFalse = busySet.set.withArgs(false);
  Sinon.assert.callOrder(...(duplicate ? [busyTrue, busyFalse, busyTrue, busyFalse] : [busyTrue, busyFalse]));

  // enabled asserts
  Sinon.assert.callCount(enabledSet.set, callCount);
  const enabledFalse = enabledSet.set.withArgs(false);
  const enabledTrue = enabledSet.set.withArgs(true);
  Sinon.assert.callOrder(
    ...(duplicate ? [enabledFalse, enabledTrue, enabledFalse, enabledTrue] : [enabledFalse, enabledTrue])
  );
}
