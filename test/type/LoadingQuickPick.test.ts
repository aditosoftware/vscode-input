import Sinon from "sinon";
import * as vscode from "vscode";
import { DialogValues, LoadingQuickPick } from "../../src";
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

    const loadingQuickPick = new LoadingQuickPick(
      "loadingQuickPick",
      "My title",
      "My loading title",
      () => [{ label: "normal item" }],
      () => [{ label: "reload item" }],
      "my reload tooltip",
      true
    );

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
    let setTitle: PropertyDescriptor & {
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
    let quickPickEnabled: PropertyDescriptor & {
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
      setTitle = Sinon.spy(quickPickWithAccept, "title", ["set"]);
      placeholderSet = Sinon.spy(quickPickWithAccept, "placeholder", ["set"]);
      busySet = Sinon.spy(quickPickWithAccept, "busy", ["set"]);
      quickPickEnabled = Sinon.spy(quickPickWithAccept, "enabled", ["set"]);

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
      setTitle.set.restore();
      placeholderSet.set.restore();
      busySet.set.restore();
      quickPickEnabled.set.restore();

      getSelectedItems.restore();

      clock.restore();
    });

    /**
     * Tests that the input is created correctly when allowing multiple inputs.
     */
    test("should create correctly with allow multiple", async () => {
      createQuickPick.returns(quickPickWithAccept);

      const loadingQuickPick = new LoadingQuickPick(
        "loadingQuickPick",
        "My title",
        "My loading title",
        () => [{ label: "normal item" }],
        () => [{ label: "reload item" }],
        "my reload tooltip",
        true
      );

      const result = await loadingQuickPick.showDialog(new DialogValues(), 2, 4);

      assert.deepStrictEqual(expectedItems, result);

      assert.strictEqual(true, quickPickWithAccept.ignoreFocusOut, "ignoreFocusOut");
      assert.strictEqual(true, quickPickWithAccept.canSelectMany, "canSelectMany");
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

      // title asserts
      Sinon.assert.calledTwice(setTitle.set);
      Sinon.assert.callOrder(
        setTitle.set.withArgs("My loading title - (Step 2 of 4)"),
        setTitle.set.withArgs("My title - (Step 2 of 4)")
      );

      // placeholder asserts
      Sinon.assert.calledTwice(placeholderSet.set);
      Sinon.assert.callOrder(
        placeholderSet.set.withArgs("Please wait, loading is in progress. This might take a while."),
        placeholderSet.set.withArgs("Select any number of items")
      );

      // busy asserts
      Sinon.assert.calledTwice(busySet.set);
      Sinon.assert.callOrder(busySet.set.withArgs(true), busySet.set.withArgs(false));

      // enabled asserts
      Sinon.assert.calledTwice(quickPickEnabled.set);
      Sinon.assert.callOrder(quickPickEnabled.set.withArgs(false), quickPickEnabled.set.withArgs(true));

      assert.strictEqual("normal item", quickPickWithAccept.items.map((pItem) => pItem.label).join(""), "items");
    });

    /**
     * Validates that the reload is triggered normally.
     */
    test("should trigger reload", async () => {
      createQuickPick.returns(quickPickWithAccept);

      // create a dummy log instance for the logging
      const context: vscode.ExtensionContext = {
        subscriptions: [],
        logUri: vscode.Uri.file(path.join(os.tmpdir(), "input")),
      } as unknown as vscode.ExtensionContext;
      Logger.initializeLogger(context, "Input");

      const debugLog = Sinon.spy(Logger.getLogger(), "debug");

      // trigger method for reload button press
      const onDidTriggerButtonStub = Sinon.stub(quickPickWithAccept, "onDidTriggerButton");

      const loadingQuickPick = new LoadingQuickPick(
        "loadingQuickPick",
        "My title",
        "My loading title",
        () => [{ label: "normal item" }],
        () => [{ label: "reload item" }],
        "my reload tooltip"
      );

      const result = await loadingQuickPick.showDialog(new DialogValues(), 2, 4);

      assert.deepStrictEqual(expectedItems, result);

      assert.strictEqual(true, quickPickWithAccept.ignoreFocusOut, "ignoreFocusOut");
      assert.strictEqual(false, quickPickWithAccept.canSelectMany, "canSelectMany");
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

      // title asserts
      Sinon.assert.calledTwice(setTitle.set);
      Sinon.assert.callOrder(
        setTitle.set.withArgs("My loading title - (Step 2 of 4)"),
        setTitle.set.withArgs("My title - (Step 2 of 4)")
      );

      // placeholder asserts
      Sinon.assert.calledTwice(placeholderSet.set);
      Sinon.assert.callOrder(
        placeholderSet.set.withArgs("Please wait, loading is in progress. This might take a while."),
        placeholderSet.set.withArgs("Select one item")
      );

      // busy asserts
      Sinon.assert.calledTwice(busySet.set);
      Sinon.assert.callOrder(busySet.set.withArgs(true), busySet.set.withArgs(false));

      // enabled asserts
      Sinon.assert.calledTwice(quickPickEnabled.set);
      Sinon.assert.callOrder(quickPickEnabled.set.withArgs(false), quickPickEnabled.set.withArgs(true));

      assert.strictEqual("normal item", quickPickWithAccept.items.map((pItem) => pItem.label).join(""), "items");

      // Trigger the reload
      onDidTriggerButtonStub.callArgWith(0, quickPickWithAccept.buttons[0]);

      // advance the clock 2 ms, to trigger the callback in the setTimeout
      await clock.tickAsync(2);

      // title asserts
      Sinon.assert.callCount(setTitle.set, 4);
      Sinon.assert.callOrder(
        setTitle.set.withArgs("My loading title - (Step 2 of 4)"),
        setTitle.set.withArgs("My title - (Step 2 of 4)"),
        setTitle.set.withArgs("My loading title - (Step 2 of 4)"),
        setTitle.set.withArgs("My title - (Step 2 of 4)")
      );

      // placeholder asserts
      Sinon.assert.callCount(placeholderSet.set, 4);
      Sinon.assert.callOrder(
        placeholderSet.set.withArgs("Please wait, loading is in progress. This might take a while."),
        placeholderSet.set.withArgs("Select one item"),
        placeholderSet.set.withArgs("Please wait, loading is in progress. This might take a while."),
        placeholderSet.set.withArgs("Select one item")
      );

      // busy asserts
      Sinon.assert.callCount(busySet.set, 4);
      Sinon.assert.callOrder(
        busySet.set.withArgs(true),
        busySet.set.withArgs(false),
        busySet.set.withArgs(true),
        busySet.set.withArgs(false)
      );

      // enabled asserts
      Sinon.assert.callCount(quickPickEnabled.set, 4);
      Sinon.assert.callOrder(
        quickPickEnabled.set.withArgs(false),
        quickPickEnabled.set.withArgs(true),
        quickPickEnabled.set.withArgs(false),
        quickPickEnabled.set.withArgs(true)
      );

      // check that the reload was logged
      Sinon.assert.calledTwice(debugLog);
      Sinon.assert.callOrder(
        debugLog.withArgs({ message: "Reload triggered for My title" }),
        debugLog.withArgs({ message: "Reload done for My title" })
      );

      // assert that the reload item was loaded
      assert.strictEqual(
        "reload item",
        quickPickWithAccept.items.map((pItem) => pItem.label).join(""),
        "items after reload"
      );

      Sinon.assert.calledOnce(createQuickPick);

      debugLog.restore();
      onDidTriggerButtonStub.restore();
    });
  });
});
