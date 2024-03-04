import { DialogValues } from "..";
import * as vscode from "vscode";
import { GenericQuickPick, GenericQuickPickOptions } from "./GenericQuickPick";

/**
 * Any quick pick that does not require any sort of loading.
 */
export class QuickPick extends GenericQuickPick<GenericQuickPickOptions> {
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
}
