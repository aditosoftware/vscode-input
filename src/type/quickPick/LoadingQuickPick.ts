import { DialogValues, InputAction } from "../..";
import * as vscode from "vscode";
import { GenericQuickPick } from "./AbstractQuickPick";
import { GenericQuickPickOptions, QuickPickItemFunction, QuickPickItems } from "./GenericQuickPick";
import { logger } from "../../handleMultiStepInput";

/**
 * Namespace for any loading quick pick
 */
export namespace LoadingQuickPick {
  /**
   * Any options for loading quick picks
   */
  export interface LoadingQuickPickOptions extends GenericQuickPickOptions {
    /**
     * The function that is used for reload any data.
     * This can be different from the normal data generate function (`generateItems`).
     * If you do not give any function, then `generateItems` will be used to reload the items.
     */
    readonly reloadItems?: QuickPickItemFunction;

    /**
     * The tooltip that should be shown when reloading
     */
    readonly reloadTooltip: string;
  }
}

/**
 * A long loading quick pick input. This should be used, if there is any long-loading data is expected.
 *
 * For example, if your loading takes 20 seconds, you should use this input over QuickPick, because this will notify the user about the loading process.
 * If you don't have any data that needs loading or your data is expected to have a very short loading time, then you should use QuickPick
 */
export class LoadingQuickPick extends GenericQuickPick<LoadingQuickPick.LoadingQuickPickOptions> {
  /**
   * @override
   */
  async showDialog(
    currentResults: DialogValues,
    title: string,
    showBackButton: boolean
  ): Promise<string[] | InputAction.BACK | undefined> {
    const reloadButton: vscode.QuickInputButton = {
      iconPath: new vscode.ThemeIcon("sync"),
      tooltip: this.inputOptions.reloadTooltip,
    };

    // Show quick input with loaded data
    const quickPick = vscode.window.createQuickPick();
    quickPick.title = title;
    quickPick.ignoreFocusOut = true;
    quickPick.canSelectMany = this.inputOptions.allowMultiple ? this.inputOptions.allowMultiple : false;
    // add a reload button
    const buttons: vscode.QuickInputButton[] = [reloadButton];
    if (showBackButton) {
      // only add a back button when we are not in the first step
      buttons.push(vscode.QuickInputButtons.Back);
    }
    quickPick.buttons = buttons;

    // sets everything for the first loading
    this.prepareLoading(quickPick);

    // show the quick pick
    quickPick.show();

    // loads all the items and shows them
    const data = await this.loadItems(this.inputOptions.generateItems, currentResults);
    this.handlePostLoading(quickPick, data, currentResults);

    // Wait for user input or cancellation
    return new Promise<string[] | InputAction.BACK | undefined>((resolve) => {
      // and add a handler for the buttons
      this.disposables.push(
        quickPick.onDidTriggerButton((button) => {
          if (button === vscode.QuickInputButtons.Back) {
            resolve(InputAction.BACK);
          } else if (button === reloadButton) {
            logger.debug({ message: `Reload triggered for ${title}` });
            this.prepareLoading(quickPick);

            // dummy timeout, because I did not find any other solution how to show the busy indicator to the user
            setTimeout(() => {
              // load the items and then update title and items
              this.loadItems(this.inputOptions.reloadItems ?? this.inputOptions.generateItems, currentResults)
                .then((result) => {
                  this.handlePostLoading(quickPick, result, currentResults);
                  logger.debug({ message: `Reload done for ${title}` });
                })
                .catch((error) => logger.error({ message: "error loading the data", error }));
            }, 1);
          }
        }),

        quickPick.onDidAccept(() => {
          resolve(quickPick.selectedItems.map((pSelected) => pSelected.label));
        }),

        quickPick.onDidHide(() => {
          resolve(undefined);
        })
      );
      this.disposables.push(quickPick);
    });
  }

  /**
   * Blocks the quick pick for loading.
   *
   * @param quickPick - the real quick pick component
   */
  private prepareLoading(quickPick: vscode.QuickPick<vscode.QuickPickItem>): void {
    quickPick.placeholder = "Please wait, loading is in progress. This might take a while.";
    quickPick.busy = true;
    quickPick.enabled = false;
  }

  /**
   * Enables the quick pick after the loading and sets the new items.
   *
   * @param quickPick - the real quick pick component
   * @param data - the loaded data
   * @param currentResults - the current selected dialog values
   */
  private handlePostLoading(
    quickPick: vscode.QuickPick<vscode.QuickPickItem>,
    data: QuickPickItems,
    currentResults: DialogValues
  ): void {
    quickPick.placeholder = this.generatePlaceHolder(data.additionalPlaceholder);
    quickPick.busy = false;
    quickPick.enabled = true;
    quickPick.items = data.items;

    // update the selected items if there were old values given and many values were selected
    this.setSelectedItems(quickPick, currentResults);
  }
}
