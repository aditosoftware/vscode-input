import { InputBase, DialogValues, InputBaseOptions, InputAction } from ".";
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

  let lastStep: { stepNumber: number; index: number } = { stepNumber: 1, index: 0 };

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];

    // check if input is needed
    if (!input.inputOptions.onBeforeInput || input.inputOptions.onBeforeInput(dialogValues)) {
      // if needed, then show dialog
      const result = await input.showDialog(dialogValues, currentStep, totalNumber);

      // dispose everything no longer needed from the input
      input.dispose();

      if (!result) {
        // User canceled the selection
        logger.debug({ message: `Command ${input.inputOptions.name} was cancelled` });
        return;
      }

      if (result === InputAction.BACK) {
        // if the back button was pressed, set index and step counter to the last valid used elements
        i = lastStep.index - 1;
        currentStep = lastStep.stepNumber;
        continue;
      }

      dialogValues.addValue(input.inputOptions.name, result);

      // if there is some special behavior after the input, handle it
      if (input.inputOptions.onAfterInput) {
        input.inputOptions.onAfterInput(dialogValues);
      }

      // save the last valid step for going back
      lastStep = { stepNumber: currentStep, index: i };

      currentStep++;
    } else {
      // input not needed, count down total number
      totalNumber--;
    }
  }

  return dialogValues;
}
