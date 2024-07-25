import { DialogValues, InputAction, GenericQuickPickOptions } from "../..";
import * as vscode from "vscode";
import { GenericQuickPick } from "./AbstractQuickPick";

export namespace QuickPick {
  /**
   * The options that should be used for any normal quick pick.
   */
  export interface QuickPickOptions extends GenericQuickPickOptions {
    /**
     * If the UI should stay open even when loosing UI focus. Defaults to false.
     * This setting is ignored on iPad and is always false.
     */
    readonly ignoreFocusOut?: boolean;
  }
}

/**
 * Any quick pick that does not require any sort of loading.
 */
export class QuickPick extends GenericQuickPick<QuickPick.QuickPickOptions> {
  /**
   * @override
   */
  async showDialog(
    currentResults: DialogValues,
    title: string,
    showBackButton: boolean
  ): Promise<string[] | InputAction | undefined> {
    const items = await this.loadItems(this.inputOptions.generateItems, currentResults);

    const quickPick = vscode.window.createQuickPick();
    quickPick.title = title;
    quickPick.placeholder = this.generatePlaceHolder(items.additionalPlaceholder);
    quickPick.canSelectMany = this.inputOptions.allowMultiple ?? false;
    quickPick.items = items.items;
    quickPick.ignoreFocusOut = this.inputOptions.ignoreFocusOut ?? false;

    // update the selected items if there were old values given and many values were selected
    this.setSelectedItems(quickPick, currentResults);

    // only show back button when not first step
    if (showBackButton) {
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
