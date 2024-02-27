import { AfterInputType, BeforeInputType, DialogValues, QuickPick, QuickPickItemFunction, QuickPickItems } from "..";
import { Logger } from "@aditosoftware/vscode-logging";
import * as vscode from "vscode";

/**
 * A long loading quick pick input. This should be used, if there is any long-loading data is expected.
 *
 * For example, if your loading takes 20 seconds, you should use this input over QuickPick, because this will notify the user about the loading process.
 * If you don't have any data that needs loading or your data is expected to have a very short loading time, then you should use QuickPick
 */
export class LoadingQuickPick extends QuickPick {
  /**
   * Constructor.
   * @param loadingTitle - The title that should be shown during the loading.
   * @param reloadItems - The function that is used for reload any data.    * This can be different from the normal data generate function (`generateItems`)
   * @param reloadTooltip - The tooltip that should be shown when reloading
   */
  constructor(
    name: string,
    title: string,
    private loadingTitle: string,
    generateItems: QuickPickItemFunction,
    private reloadItems: QuickPickItemFunction,
    private reloadTooltip: string,
    allowMultiple?: boolean,
    beforeInput?: BeforeInputType,
    afterInput?: AfterInputType
  ) {
    super(name, title, generateItems, allowMultiple, beforeInput, afterInput);
    this.loadingTitle = loadingTitle;
    this.reloadItems = reloadItems;
    this.reloadTooltip = reloadTooltip;
  }

  async showDialog(
    currentResults: DialogValues,
    currentStep: number,
    maximumStep: number
  ): Promise<string[] | undefined> {
    const reloadButton: vscode.QuickInputButton = {
      iconPath: new vscode.ThemeIcon("sync"),
      tooltip: this.reloadTooltip,
    };

    // Show quick input with loaded data
    const quickPick = vscode.window.createQuickPick();
    quickPick.ignoreFocusOut = true;
    quickPick.canSelectMany = this.allowMultiple ? this.allowMultiple : false;
    // add a reload button
    quickPick.buttons = [reloadButton];

    // and add a handler for the reload button
    quickPick.onDidTriggerButton((button) => {
      if (button === reloadButton) {
        Logger.getLogger().debug({ message: `Reload triggered for ${this.title}` });
        this.prepareLoading(quickPick, currentStep, maximumStep);

        // dummy timeout, because I did not find any other solution how to show the busy indicator to the user
        setTimeout(() => {
          // load the items and then update title and items
          this.loadItems(this.reloadItems, currentResults).then((result) => {
            this.handlePostLoading(quickPick, currentStep, maximumStep, result);
            Logger.getLogger().debug({ message: `Reload done for ${this.title}` });
          });
        }, 1);
      }
    });
    // sets everything for the first loading
    this.prepareLoading(quickPick, currentStep, maximumStep);

    // show the quick pick
    quickPick.show();

    // loads all the items and shows them
    const data = await this.loadItems(this.generateItems, currentResults);
    this.handlePostLoading(quickPick, currentStep, maximumStep, data);

    // Wait for user input or cancellation
    const selected = await this.handleSelection(quickPick);

    return selected;
  }

  /**
   * Handles the selection of the quick pick items.
   *
   * If there are items selected, then the label of the selected items will be returned.
   *
   * TODO check if tests are possible for this method
   *
   * @param quickPick - the quick pick
   * @returns the selected items
   */
  private async handleSelection(quickPick: vscode.QuickPick<vscode.QuickPickItem>): Promise<string[] | undefined> {
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
    quickPick.title = this.generateTitle(this.loadingTitle, currentStep, maximumStep);
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
    quickPick.placeholder = this.generatePlaceholder();
    quickPick.title = this.generateTitle(this.title, currentStep, maximumStep, data.additionalTitle);
    quickPick.items = data.items;
    quickPick.busy = false;
    quickPick.enabled = true;
  }
}
