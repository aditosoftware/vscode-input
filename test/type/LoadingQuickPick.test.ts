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
  let createQuickPickSpy: sinon.SinonSpy;
  let realElement: vscode.QuickPick<vscode.QuickPickItem>;

  let quickPickTitle: PropertyDescriptor & {
    get: Sinon.SinonSpy<[], string | undefined>;
    set: Sinon.SinonSpy<[string | undefined], void>;
  };
  let quickPickPlaceholder: PropertyDescriptor & {
    get: Sinon.SinonSpy<[], string | undefined>;
    set: Sinon.SinonSpy<[string | undefined], void>;
  };
  let quickPickBusy: PropertyDescriptor & {
    get: Sinon.SinonSpy<[], boolean>;
    set: Sinon.SinonSpy<[boolean], void>;
  };
  let quickPickEnabled: PropertyDescriptor & {
    get: Sinon.SinonSpy<[], boolean>;
    set: Sinon.SinonSpy<[boolean], void>;
  };

  let clock: Sinon.SinonFakeTimers;

  /**
   * Creates the necessary stubs before each test.
   */
  setup("create stubs", () => {
    realElement = vscode.window.createQuickPick();

    quickPickTitle = Sinon.spy(realElement, "title", ["set"]);
    quickPickPlaceholder = Sinon.spy(realElement, "placeholder", ["set"]);
    quickPickBusy = Sinon.spy(realElement, "busy", ["set"]);
    quickPickEnabled = Sinon.spy(realElement, "enabled", ["set"]);

    createQuickPickSpy = Sinon.stub(vscode.window, "createQuickPick").returns(realElement);

    clock = Sinon.useFakeTimers();
  });

  /**
   * Restore all the stubs after each test.
   */
  teardown("restore", () => {
    createQuickPickSpy.restore();

    quickPickTitle.set.restore();
    quickPickPlaceholder.set.restore();
    quickPickBusy.set.restore();
    quickPickEnabled.set.restore();

    clock.restore();
  });

  /**
   * Tests that the input is created correctly when allowing multiple inputs.
   */
  test("should create correctly with allow multiple", async () => {
    const loadingQuickPick = new LoadingQuickPick(
      "loadingQuickPick",
      "My title",
      "My loading title",
      () => [{ label: "normal item" }],
      () => [{ label: "reload item" }],
      "my reload tooltip",
      true
    );

    // set the selection of the the quickPick.
    // use any, because otherwise we can not access private methods.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSelectionStub = Sinon.stub(loadingQuickPick, <any>"handleSelection");
    handleSelectionStub.returns(["any element"]);

    const result = await loadingQuickPick.showDialog(new DialogValues(), 2, 4);

    assert.deepStrictEqual(["any element"], result);

    assert.strictEqual(true, realElement.ignoreFocusOut, "ignoreFocusOut");
    assert.strictEqual(true, realElement.canSelectMany, "canSelectMany");
    assert.deepStrictEqual(
      [
        {
          iconPath: new vscode.ThemeIcon("sync"),
          tooltip: "my reload tooltip",
        },
      ],
      realElement.buttons,
      "buttons"
    );

    // title asserts
    Sinon.assert.calledTwice(quickPickTitle.set);
    Sinon.assert.callOrder(
      quickPickTitle.set.withArgs("My loading title - (Step 2 of 4)"),
      quickPickTitle.set.withArgs("My title - (Step 2 of 4)")
    );

    // placeholder asserts
    Sinon.assert.calledTwice(quickPickPlaceholder.set);
    Sinon.assert.callOrder(
      quickPickPlaceholder.set.withArgs("Please wait, loading is in progress. This might take a while."),
      quickPickPlaceholder.set.withArgs("Select any number of items")
    );

    // busy asserts
    Sinon.assert.calledTwice(quickPickBusy.set);
    Sinon.assert.callOrder(quickPickBusy.set.withArgs(true), quickPickBusy.set.withArgs(false));

    // enabled asserts
    Sinon.assert.calledTwice(quickPickEnabled.set);
    Sinon.assert.callOrder(quickPickEnabled.set.withArgs(false), quickPickEnabled.set.withArgs(true));

    assert.strictEqual("normal item", realElement.items.map((pItem) => pItem.label).join(""), "items");
  });

  /**
   * Validates that the reload is triggered normally.
   */
  test("should trigger reload", async () => {
    // create a dummy log instance for the logging
    const context: vscode.ExtensionContext = {
      subscriptions: [],
      logUri: vscode.Uri.file(path.join(os.tmpdir(), "input")),
    } as unknown as vscode.ExtensionContext;
    Logger.initializeLogger(context, "Input");

    const debugLog = Sinon.spy(Logger.getLogger(), "debug");

    // trigger method for reload button press
    const onDidTriggerButtonStub = Sinon.stub(realElement, "onDidTriggerButton");

    const loadingQuickPick = new LoadingQuickPick(
      "loadingQuickPick",
      "My title",
      "My loading title",
      () => [{ label: "normal item" }],
      () => [{ label: "reload item" }],
      "my reload tooltip"
    );

    // set the selection of the the quickPick.
    // use any, because otherwise we can not access private methods.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSelectionStub = Sinon.stub(loadingQuickPick, <any>"handleSelection");
    handleSelectionStub.returns(["any element"]);

    const result = await loadingQuickPick.showDialog(new DialogValues(), 2, 4);

    assert.deepStrictEqual(["any element"], result);

    assert.strictEqual(true, realElement.ignoreFocusOut, "ignoreFocusOut");
    assert.strictEqual(false, realElement.canSelectMany, "canSelectMany");
    assert.deepStrictEqual(
      [
        {
          iconPath: new vscode.ThemeIcon("sync"),
          tooltip: "my reload tooltip",
        },
      ],
      realElement.buttons,
      "buttons"
    );

    // title asserts
    Sinon.assert.calledTwice(quickPickTitle.set);
    Sinon.assert.callOrder(
      quickPickTitle.set.withArgs("My loading title - (Step 2 of 4)"),
      quickPickTitle.set.withArgs("My title - (Step 2 of 4)")
    );

    // placeholder asserts
    Sinon.assert.calledTwice(quickPickPlaceholder.set);
    Sinon.assert.callOrder(
      quickPickPlaceholder.set.withArgs("Please wait, loading is in progress. This might take a while."),
      quickPickPlaceholder.set.withArgs("Select one item")
    );

    // busy asserts
    Sinon.assert.calledTwice(quickPickBusy.set);
    Sinon.assert.callOrder(quickPickBusy.set.withArgs(true), quickPickBusy.set.withArgs(false));

    // enabled asserts
    Sinon.assert.calledTwice(quickPickEnabled.set);
    Sinon.assert.callOrder(quickPickEnabled.set.withArgs(false), quickPickEnabled.set.withArgs(true));

    assert.strictEqual("normal item", realElement.items.map((pItem) => pItem.label).join(""), "items");

    // Trigger the reload
    onDidTriggerButtonStub.callArgWith(0, realElement.buttons[0]);

    // advance the clock 2 ms, to trigger the callback in the setTimeout
    await clock.tickAsync(2);

    // title asserts
    Sinon.assert.callCount(quickPickTitle.set, 4);
    Sinon.assert.callOrder(
      quickPickTitle.set.withArgs("My loading title - (Step 2 of 4)"),
      quickPickTitle.set.withArgs("My title - (Step 2 of 4)"),
      quickPickTitle.set.withArgs("My loading title - (Step 2 of 4)"),
      quickPickTitle.set.withArgs("My title - (Step 2 of 4)")
    );

    // placeholder asserts
    Sinon.assert.callCount(quickPickPlaceholder.set, 4);
    Sinon.assert.callOrder(
      quickPickPlaceholder.set.withArgs("Please wait, loading is in progress. This might take a while."),
      quickPickPlaceholder.set.withArgs("Select one item"),
      quickPickPlaceholder.set.withArgs("Please wait, loading is in progress. This might take a while."),
      quickPickPlaceholder.set.withArgs("Select one item")
    );

    // busy asserts
    Sinon.assert.callCount(quickPickBusy.set, 4);
    Sinon.assert.callOrder(
      quickPickBusy.set.withArgs(true),
      quickPickBusy.set.withArgs(false),
      quickPickBusy.set.withArgs(true),
      quickPickBusy.set.withArgs(false)
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
    assert.strictEqual("reload item", realElement.items.map((pItem) => pItem.label).join(""), "items after reload");

    Sinon.assert.calledOnce(createQuickPickSpy);

    onDidTriggerButtonStub.restore();
    handleSelectionStub.restore();
    debugLog.restore();
  });
});
