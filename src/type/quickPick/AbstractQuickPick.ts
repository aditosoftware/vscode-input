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
   *
   * @param loadFunction - the function to load the items
   * @param currentResults - the current dialog results
   * @returns the loaded items and an optional additional title
   */
  protected async loadItems(
    loadFunction: QuickPickItemFunction,
    currentResults: DialogValues
  ): Promise<QuickPickItems> {
    const items: vscode.QuickPickItem[] = [];
    let additionalPlaceholder: string | undefined;

    const generatedItems = await loadFunction(currentResults);

    if (Array.isArray(generatedItems)) {
      items.push(...generatedItems);
    } else {
      items.push(...generatedItems.items);
      additionalPlaceholder = generatedItems.additionalPlaceholder;
    }

    return { items, additionalPlaceholder };
  }

  /**
   * Generates the placeHolder for the quick picks.
   *
   * @param additionalPlaceHolder - the additional placeHolder from the {@link QuickPickItem.additionalPlaceholder}
   * @returns the placeHolder that should be used for any quick pick.
   */
  protected generatePlaceHolder(additionalPlaceHolder?: string): string {
    if (additionalPlaceHolder) {
      return `${this.inputOptions.placeHolder} (${additionalPlaceHolder})`;
    } else {
      return this.inputOptions.placeHolder;
    }
  }

  /**
   * Sets the selected items.
   *
   * These can be from the current dialog values in the quick pick or
   * from the items of the quick pick that were pre-picked by the program.
   *
   * This will only happen if the quick pick can select many items.
   *
   * @param quickPick - the quick pick that was generated
   * @param currentResults - the current dialog values
   */
  protected setSelectedItems(quickPick: vscode.QuickPick<vscode.QuickPickItem>, currentResults: DialogValues): void {
    if (quickPick.canSelectMany) {
      const oldValues = currentResults.inputValues.get(this.inputOptions.name);

      const selectedItems: vscode.QuickPickItem[] = [];

      quickPick.items.forEach((pItem) => {
        const label = pItem.label;
        if (oldValues?.includes(label)) {
          // if the current item was in the oldValues, then pick it
          pItem.picked = true;
          selectedItems.push(pItem);
        } else if (pItem.picked) {
          // if there are no old values, then set the selected  items to the picked items
          selectedItems.push(pItem);
        }
        // There exists no fallback - either we select the given old values or the picked items that were loaded as picked.
        // If we do not have any of those two cases, then nothing should be picked immediately.
      });

      if (selectedItems && selectedItems.length !== 0) {
        quickPick.selectedItems = selectedItems;
      }
    }
  }
}
