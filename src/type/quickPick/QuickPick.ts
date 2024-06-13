import { DialogValues, InputAction, GenericQuickPickOptions } from "../..";
import * as vscode from "vscode";
import { GenericQuickPick } from "./AbstractQuickPick";

/**
 * Namespace for any normal quick pick
 */
export namespace QuickPick {
  /**
   * The options that should be used for any normal quick pick.
   */
  export interface QuickPickOptions extends GenericQuickPickOptions {
    /**
     * The placeholder that should be used for the input
     */
    readonly placeholder?: string;
  }
}

/**
 * Any quick pick that does not require any sort of loading.
 */
export class QuickPick extends GenericQuickPick<QuickPick.QuickPickOptions> {
  async showDialog(
    currentResults: DialogValues,
    currentStep: number,
    maximumStep: number
  ): Promise<string[] | InputAction | undefined> {
    const items = await this.loadItems(this.inputOptions.generateItems, currentResults);

    const quickPick = vscode.window.createQuickPick();
    quickPick.title = this.generateTitle(this.inputOptions.title, currentStep, maximumStep, items.additionalTitle);
    quickPick.placeholder = this.inputOptions.placeholder ?? this.generatePlaceholder();
    quickPick.canSelectMany = this.inputOptions.allowMultiple ?? false;
    quickPick.items = items.items;

    // update the selected items if there were old values given and many values were selected
    this.setSelectedItems(quickPick, currentResults);

    // only show back button when not first step
    if (currentStep !== 1) {
      quickPick.buttons = [vscode.QuickInputButtons.Back];
    }

    return new Promise<string[] | InputAction | undefined>((resolve) => {
      this.disposables.push(
        // handle the back button
        quickPick.onDidTriggerButton((button) => {
          if (button === vscode.QuickInputButtons.Back) {
            resolve(InputAction.BACK);
          }
        }),

        // handle the hiding of the input
        quickPick.onDidHide(() => {
          resolve(undefined);
        }),

        // handle the accepting. This will put the labels of the QuickPickItems into the returned element
        quickPick.onDidAccept(() => {
          resolve(quickPick.selectedItems.map((pElement) => pElement.label));
        })
      );

      this.disposables.push(quickPick);

      // show the quick pick
      quickPick.show();
    });
  }
}
