import {
  ConfirmationDialog,
  DialogValues,
  handleMultiStepInput,
  InputBox,
  LoadingQuickPick,
  OpenDialog,
  QuickPick,
} from "../../src";
import * as vscode from "vscode";

/**
 * This method contains an example of various inputs you can give during the multi step input.
 *
 * All of those examples are referenced in the `README.md` file.
 *
 * If there is any change in the methods calls, then you need to adjust the `README.md`.
 */
export async function generateExampleMultiStepInput(): Promise<void> {
  const components = [
    new InputBox({
      name: "userName",
      inputBoxOptions: {
        placeHolder: "Give any user name",
        ignoreFocusOut: true,
      },
    }),

    new LoadingQuickPick({
      name: "foodPreferenceLoading",
      placeHolder: "Select your food preference",

      generateItems: () => [
        { label: "Meat", description: "Eat any kind of meat" },
        { label: "Fish", description: "Eat any kind of fish" },
        { label: "Vegetarian", description: "Eat no meat and fish, but animal products like milk" },
        { label: "Vegan", description: "Eat no animal products" },
      ],
      // long running function to reload the items
      reloadItems: async () => {
        const foodPreferences: string[] = await queryWebsiteForFoodPreferences();

        return foodPreferences.map((pPreference) => {
          const item: vscode.QuickPickItem = {
            label: pPreference,
          };
          return item;
        });
      },
      reloadTooltip: "Reload food preferences",
    }),

    new OpenDialog({
      name: "chooseAnyFile",
      openDialogOptions: { openLabel: "Select any file" },
    }),

    new OpenDialog({
      name: "chooseTextFile",
      openDialogOptions: {
        openLabel: "Select any text file",
        filters: {
          Text: ["txt"],
        },
      },
    }),

    new QuickPick({
      name: "foodPreference",
      placeHolder: "Select your food preference",
      ignoreFocusOut: true,
      generateItems: () => [
        { label: "Meat", description: "Eat any kind of meat" },
        { label: "Fish", description: "Eat any kind of fish" },
        { label: "Vegetarian", description: "Eat no meat and fish, but animal products like milk" },
        { label: "Vegan", description: "Eat no animal products" },
      ],
    }),

    new ConfirmationDialog({
      name: "Confirmation",
      message: "My message",
      detail: (dialogValues: DialogValues) => `Detail: ${dialogValues.inputValues.size}`,
      confirmButtonName: "Confirm Delete",
    }),
  ];

  const result = await handleMultiStepInput("Demonstration for inputs", components);

  if (result) {
    // now, handle the result

    const userName = result.inputValues.get("userName")?.[0];
    const foodPreferenceLoading = result.inputValues.get("foodPreferenceLoading")?.[0];
    const chooseAnyFile = result.inputValues.get("chooseAnyFile")?.[0];
    const chooseTextFile = result.inputValues.get("chooseTextFile")?.[0];
    const foodPreference = result.inputValues.get("foodPreference")?.[0];

    // confirmation is also a string, because the boolean of it is transformed
    const confirmation = result.inputValues.get("Confirmation")?.[0];

    if (userName && foodPreferenceLoading && chooseAnyFile && chooseTextFile && foodPreference && confirmation) {
      console.log("all inputs are there");

      // now, you can do specific things with your results
    }
  }
}

/**
 * Simulates a dummy query to a website. This does not call anything, just wait 2 seconds.
 *
 * @returns a array of food preferences
 */
async function queryWebsiteForFoodPreferences(): Promise<string[]> {
  await new Promise((r) => setTimeout(r, 2000));
  return ["cow", "pig", "chicken", "salmon", "shrimp", "egg", "cheese", "potato", "salad"];
}
