import { DialogValues, InputBase, InputBaseOptions } from "..";
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

export interface QuickPickOptions extends InputBaseOptions {
  /**
   *  The title of the quick pick.
   */
  readonly title: string;

  /**
   * Any function to generate the items for the quick pick. This can be a sync or async function.
   */
  readonly generateItems: QuickPickItemFunction;

  /**
   * Option, if multiple elements are allowed. If no value present, then only one element is allowed.
   */
  readonly allowMultiple?: boolean;
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
   * Any additional title. If this title was given, it will be displayed in brackets in the title of the quick pick.
   */
  additionalTitle?: string;
}

/**
 * Any quick pick that is not an selection of an connection.
 */
export class QuickPick<T extends QuickPickOptions> extends InputBase<T> {
  async showDialog(
    currentResults: DialogValues,
    currentStep: number,
    maximumStep: number
  ): Promise<string[] | undefined> {
    const items = await this.loadItems(this.inputOptions.generateItems, currentResults);

    const result: vscode.QuickPickItem | vscode.QuickPickItem[] | undefined = await vscode.window.showQuickPick(
      items.items,
      {
        canPickMany: this.inputOptions.allowMultiple,
        title: this.generateTitle(this.inputOptions.title, currentStep, maximumStep, items.additionalTitle),
        placeHolder: this.generatePlaceholder(),
      }
    );

    if (result) {
      if (Array.isArray(result)) {
        return result.map((pElement) => pElement.label);
      } else {
        return [result.label];
      }
    }

    return result;
  }

  /**
   * Loads the items via the given function.
   * It will also transform all the different data formats into one format.
   * @param loadFunction - the function to load the items
   * @param currentResults - the current dialog results
   * @returns the loaded items and an optional additional title
   */
  protected async loadItems(
    loadFunction: QuickPickItemFunction,
    currentResults: DialogValues
  ): Promise<QuickPickItems> {
    const items: vscode.QuickPickItem[] = [];
    let additionalTitle: string | undefined;

    const generatedItems = await loadFunction(currentResults);

    if (Array.isArray(generatedItems)) {
      items.push(...generatedItems);
    } else {
      items.push(...generatedItems.items);
      additionalTitle = generatedItems.additionalTitle;
    }

    return { items, additionalTitle };
  }

  /**
   * Generates the whole title for the input by using the given title and the step output
   * @param pTitle - the describing text title. This should be given by creating the class
   * @param currentStep - the current step of the input
   * @param maximumStep - the maximum step of the input
   * @param pAdditionalTitle  - any additional title
   * @returns the generated title
   */
  protected generateTitle(pTitle: string, currentStep: number, maximumStep: number, pAdditionalTitle?: string): string {
    let generatedTitle = pTitle;
    if (pAdditionalTitle) {
      generatedTitle += ` (${pAdditionalTitle})`;
    }
    generatedTitle += ` - ${this.generateStepOutput(currentStep, maximumStep)}`;
    return generatedTitle;
  }

  /**
   * Generates the placeholder by using the allowMultiple flag.
   * @returns the generated placeholder
   */
  protected generatePlaceholder(): string {
    return `Select ${this.inputOptions.allowMultiple ? "any number of items" : "one item"}`;
  }
}
