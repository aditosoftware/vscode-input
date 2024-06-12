import { DialogValues, InputBase } from "../..";
import * as vscode from "vscode";
import { GenericQuickPickOptions, QuickPickItemFunction, QuickPickItems } from "./GenericQuickPick";

/**
 * Any type of an generic quick pick. This is overwritten again in different forms. This quick pick should not be used.
 */
export abstract class GenericQuickPick<T extends GenericQuickPickOptions> extends InputBase<T> {
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

  /**
   * Picks the previous selected values from the current dialog values in the quick pick.
   *
   * This will only happen if the quick pick can select many items.
   *
   * @param quickPick - the quick pick that was generated
   * @param currentResults - the current dialog values
   */
  protected addPreviousSelection(
    quickPick: vscode.QuickPick<vscode.QuickPickItem>,
    currentResults: DialogValues
  ): void {
    if (quickPick.canSelectMany) {
      const oldValues = currentResults.inputValues.get(this.inputOptions.name);

      if (oldValues) {
        const selectedItems: vscode.QuickPickItem[] = [];

        quickPick.items.forEach((pItem) => {
          const label = pItem.label;
          if (oldValues.includes(label)) {
            // if the current item was in the oldValues, then pick it and save it to the selected items
            pItem.picked = true;

            selectedItems.push(pItem);
          }
        });

        quickPick.selectedItems = selectedItems;
      }
    }
  }
}
