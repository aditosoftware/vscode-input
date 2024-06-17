import { DialogValues, GenericQuickPickOptions } from "../..";
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
  /**
   * @override
   */
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
        placeHolder: this.inputOptions.placeholder ?? this.generatePlaceholder(),
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
}
