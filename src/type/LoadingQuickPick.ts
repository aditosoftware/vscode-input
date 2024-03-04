import { DialogValues } from "..";
import { Logger } from "@aditosoftware/vscode-logging";
import * as vscode from "vscode";
import { GenericQuickPick, GenericQuickPickOptions, QuickPickItemFunction, QuickPickItems } from "./GenericQuickPick";

/**
 * Any options for loading quick picks
 */
interface LoadingQuickPickOptions extends GenericQuickPickOptions {
  /**
   * The title that should be shown during the loading.
   */
  readonly loadingTitle: string;

  /**
   * The function that is used for reload any data.
   * This can be different from the normal data generate function (`generateItems`).
   * If you do not give any function, then `generateItems` will be used to reload the items.
   */
  readonly reloadItems?: QuickPickItemFunction;

  /**
   *  The tooltip that should be shown when reloading
   */
  readonly reloadTooltip: string;
}

/**
 * A long loading quick pick input. This should be used, if there is any long-loading data is expected.
 *
 * For example, if your loading takes 20 seconds, you should use this input over QuickPick, because this will notify the user about the loading process.
 * If you don't have any data that needs loading or your data is expected to have a very short loading time, then you should use QuickPick
 */
export class LoadingQuickPick extends GenericQuickPick<LoadingQuickPickOptions> {
  async showDialog(
    currentResults: DialogValues,
    currentStep: number,
    maximumStep: number
  ): Promise<string[] | undefined> {
    const reloadButton: vscode.QuickInputButton = {
      iconPath: new vscode.ThemeIcon("sync"),
      tooltip: this.inputOptions.reloadTooltip,
    };

    // Show quick input with loaded data
    const quickPick = vscode.window.createQuickPick();
    quickPick.ignoreFocusOut = true;
    quickPick.canSelectMany = this.inputOptions.allowMultiple ? this.inputOptions.allowMultiple : false;
    // add a reload button
    quickPick.buttons = [reloadButton];

    // and add a handler for the reload button
    quickPick.onDidTriggerButton((button) => {
      if (button === reloadButton) {
        Logger.getLogger().debug({ message: `Reload triggered for ${this.inputOptions.title}` });
        this.prepareLoading(quickPick, currentStep, maximumStep);

        // dummy timeout, because I did not find any other solution how to show the busy indicator to the user
        setTimeout(() => {
          // load the items and then update title and items
          this.loadItems(this.inputOptions.reloadItems || this.inputOptions.generateItems, currentResults).then(
            (result) => {
              this.handlePostLoading(quickPick, currentStep, maximumStep, result);
              Logger.getLogger().debug({ message: `Reload done for ${this.inputOptions.title}` });
            }
          );
        }, 1);
      }
    });
    // sets everything for the first loading
    this.prepareLoading(quickPick, currentStep, maximumStep);

    // show the quick pick
    quickPick.show();

    // loads all the items and shows them
    const data = await this.loadItems(this.inputOptions.generateItems, currentResults);
    this.handlePostLoading(quickPick, currentStep, maximumStep, data);

    // Wait for user input or cancellation
    return await new Promise<string[] | undefined>((resolve) => {
      quickPick.onDidAccept(() => {
        resolve(quickPick.selectedItems.map((pSelected) => pSelected.label));
        quickPick.dispose();
      });
      quickPick.onDidHide(() => {
        resolve(undefined);
        quickPick.dispose();
      });
    });
  }

  /**
   * Blocks the quick pick for loading.
   * @param quickPick - the real quick pick component
   * @param currentStep - the current dialog step
   * @param maximumStep - the maximum dialog step
   */
  private prepareLoading(
    quickPick: vscode.QuickPick<vscode.QuickPickItem>,
    currentStep: number,
    maximumStep: number
  ): void {
    quickPick.title = this.generateTitle(this.inputOptions.loadingTitle, currentStep, maximumStep);
    quickPick.placeholder = "Please wait, loading is in progress. This might take a while.";
    quickPick.busy = true;
    quickPick.enabled = false;
  }

  /**
   * Enables the quick pick after the loading and sets the new items.
   * @param quickPick - the real quick pick component
   * @param currentStep - the current dialog step
   * @param maximumStep - the maximum dialog step
   * @param data - the loaded data
   */
  private handlePostLoading(
    quickPick: vscode.QuickPick<vscode.QuickPickItem>,
    currentStep: number,
    maximumStep: number,
    data: QuickPickItems
  ): void {
    quickPick.title = this.generateTitle(this.inputOptions.title, currentStep, maximumStep, data.additionalTitle);
    quickPick.placeholder = this.generatePlaceholder();
    quickPick.busy = false;
    quickPick.enabled = true;
    quickPick.items = data.items;
  }
}
