import assert from "assert";
import { DialogValues, InputBox } from "../src";

/**
 * Tests that the adding of the dialog values works.
 */
suite("DialogValues test", () => {
  const name = "myName";
  /**
   * any input for tests. Only relevant element is the name.
   */
  const inputBase = new InputBox(name, {});

  /**
   * Tests that a normal string value can be added.
   */
  test("should add string value", () => {
    const myValue = "my value";

    const dialogValues = new DialogValues();

    dialogValues.addValue(inputBase, myValue);

    assert.strictEqual(undefined, dialogValues.confirmation);
    assert.deepStrictEqual(new Map<string, string[]>([[name, [myValue]]]), dialogValues.inputValues);
  });

  /**
   * Tests that a normal string array can be added.
   */
  test("should add string array value", () => {
    const myValue = ["a", "b", "c"];

    const dialogValues = new DialogValues();

    dialogValues.addValue(inputBase, myValue);

    assert.strictEqual(undefined, dialogValues.confirmation);
    assert.deepStrictEqual(new Map<string, string[]>([[name, myValue]]), dialogValues.inputValues);
  });

  /**
   * Tests that the adding of different boolean values is working correctly
   */
  [true, false].forEach((pValue) => {
    test(`add boolean (${pValue})`, () => {
      const dialogValues = new DialogValues();

      // check no value is there
      assert.strictEqual(undefined, dialogValues.confirmation, "no value set");

      // add the value
      dialogValues.addValue(inputBase, pValue);

      assert.strictEqual(pValue, dialogValues.confirmation);
      assert.deepStrictEqual(new Map<string, string[]>(), dialogValues.inputValues);
    });
  });
});
