import { InputBase, DialogValues, InputBaseOptions } from ".";
import { Logger } from "@aditosoftware/vscode-logging";

/**
 * The logger that is used for every logging.
 */
export let logger: Logger;

/**
 * Initializes the logging for the multi step input. This needs to be done once.
 * 
 * @param pLogger - the logger that should be used for every logging
 */
export function initializeLogger(pLogger: Logger) {
  logger = pLogger;
}

/**
 * Handles a multi-step input. All the inputs will be progressed in order.
 * If any input comes back as undefined, then an information message will be shown to the user
 * and nothing will be returned.
 * @param inputs - the inputs that should be progressed
 * @param dialogValues - the dialog values with any values that were given before the multi-step-input was called.
 * @returns the dialog values from the inputs
 */
export async function handleMultiStepInput(
  inputs: InputBase<InputBaseOptions>[],
  dialogValues?: DialogValues
): Promise<DialogValues | undefined> {
  let currentStep: number = 1;

  if (!dialogValues) {
    dialogValues = new DialogValues();
  }

  let totalNumber: number = inputs.length;

  for (const input of inputs) {
    // check if input is needed
    if (!input.inputOptions.beforeInput || input.inputOptions.beforeInput(dialogValues)) {
      // if needed, then show dialog
      const result = await input.showDialog(dialogValues, currentStep, totalNumber);

      if (!result) {
        // User canceled the selection
        logger.debug({ message: `Command ${input.inputOptions.name} was cancelled` });
        return;
      }

      dialogValues.addValue(input.inputOptions.name, result);

      // if there is some special behavior after the input, handle it
      if (input.inputOptions.afterInput) {
        input.inputOptions.afterInput(dialogValues);
      }

      currentStep++;
    } else {
      // input not needed, count down total number
      totalNumber--;
    }
  }

  return dialogValues;
}
