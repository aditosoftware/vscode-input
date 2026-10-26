import assert from "node:assert";
import * as vscode from "vscode";
import { InputAction, InputBase, InputBaseOptions } from "../../src";

/**
 * Tests the abstract input base.
 */
suite("InputBase Tests", () => {
  /**
   * Tests the `dispose` method of the input base.
   */
  suite("dispose", () => {
    /**
     * Tests that all registered disposables will be disposed, when the input base is disposed.
     */
    test("should dispose all registered disposables", () => {
      const inputBase = new TestInputBase({ name: "Unit" });

      const firstDisposable = createDisposableSpy();
      const secondDisposable = createDisposableSpy();

      inputBase.addDisposable(firstDisposable);
      inputBase.addDisposable(secondDisposable);

      inputBase.dispose();

      assert.strictEqual(firstDisposable.disposed, true, "first disposable should be disposed");
      assert.strictEqual(secondDisposable.disposed, true, "second disposable should be disposed");
    });

    /**
     * Tests that disposing the input base does not throw an error, when no disposables were registered.
     */
    test("should not throw when no disposables are registered", () => {
      const inputBase = new TestInputBase({ name: "Unit" });

      assert.doesNotThrow(() => inputBase.dispose(), "dispose should not throw without disposables");
    });
  });
});

/**
 * A minimal implementation of the abstract {@link InputBase}, which is used for testing its behavior.
 */
class TestInputBase extends InputBase<InputBaseOptions> {
  /**
   * @override
   */
  async showDialog(): Promise<string | string[] | boolean | undefined | InputAction.BACK> {
    return undefined;
  }

  /**
   * Adds a disposable that should be disposed, when the input base is disposed.
   *
   * @param pDisposable - the disposable that should be added
   */
  addDisposable(pDisposable: vscode.Disposable): void {
    this.disposables.push(pDisposable);
  }
}

/**
 * A disposable that tracks whether it was disposed.
 */
interface DisposableSpy extends vscode.Disposable {
  /**
   * Indicator, if the disposable was disposed.
   */
  disposed: boolean;
}

/**
 * Creates a disposable that tracks whether it was disposed.
 *
 * @returns the created disposable spy
 */
function createDisposableSpy(): DisposableSpy {
  const disposable = {
    disposed: false,

    /**
     * Marks the disposable as disposed.
     */
    dispose: (): void => {
      disposable.disposed = true;
    },
  };

  return disposable;
}
