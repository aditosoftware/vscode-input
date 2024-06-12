import { DialogValues, InputAction } from "../..";
import * as vscode from "vscode";
import { GenericQuickPick } from "./AbstractQuickPick";
import { GenericQuickPickOptions } from "./GenericQuickPick";

/**
 * Any quick pick that does not require any sort of loading.
 */
export class QuickPick extends GenericQuickPick<GenericQuickPickOptions> {
  async showDialog(
    currentResults: DialogValues,
    currentStep: number,
    maximumStep: number
  ): Promise<string[] | InputAction | undefined> {
    const items = await this.loadItems(this.inputOptions.generateItems, currentResults);

    const quickPick = vscode.window.createQuickPick();
    quickPick.title = this.generateTitle(this.inputOptions.title, currentStep, maximumStep, items.additionalTitle);
    quickPick.placeholder = this.generatePlaceholder();
    quickPick.canSelectMany = this.inputOptions.allowMultiple ?? false;
    quickPick.items = items.items;

    // update the selected items if there were old values given and many values were selected
    this.addPreviousSelection(quickPick, currentResults);

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
