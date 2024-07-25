import { DialogValues, InputBaseOptions } from "../..";
import * as vscode from "vscode";

/**
 * The type of the function to generate the items for the quickPick.
 *
 * This function can read all previous entered dialog values.
 *
 * @returns an `QuickPickItem` array with all the loaded items. This can be returned as a normal element, or packed with an additional title.
 */
export type QuickPickItemFunction = (
  currentResults: DialogValues
) => Promise<QuickPickItems> | Promise<vscode.QuickPickItem[]> | vscode.QuickPickItem[];

/**
 * The options used for any quick pick.
 */
export interface GenericQuickPickOptions extends InputBaseOptions {
  /**
   * Any function to generate the items for the quick pick. This can be a sync or async function.
   */
  readonly generateItems: QuickPickItemFunction;

  /**
   * Option, if multiple elements are allowed. If no value present, then only one element is allowed.
   */
  readonly allowMultiple?: boolean;

  /**
   * The placeholder that should be used for the input
   */
  readonly placeHolder: string;
}

/**
 * The items loaded from the `QuickPickItemFunction`.
 * You should only use this, if you want to have an additional title.
 */
export interface QuickPickItems {
  /**
   * The items itself.
   */
  items: vscode.QuickPickItem[];

  /**
   * Any additional placeHolder. If this placeHolder was given, it will be displayed in brackets in the placeholder of the quick pick.
   */
  additionalPlaceholder?: string;
}
