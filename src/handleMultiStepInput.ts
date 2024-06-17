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

  let goingBackProcess = false;

  let totalNumber: number = inputs.length;

  const steps: { stepNumber: number; index: number; totalNumber: number }[] = [];

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
        i = handleGoingBack();
        goingBackProcess = true;
        continue;
      }

      goingBackProcess = false;

      dialogValues.addValue(input.inputOptions.name, result);

      // if there is some special behavior after the input, handle it
      input.inputOptions.onAfterInput?.(dialogValues);

      // save the last valid step for going back
      steps.push({ stepNumber: currentStep, index: i, totalNumber });

      currentStep++;
    } else if (goingBackProcess) {
      // if we are going back and skipping, then just go back one more step
      i = handleGoingBack();
    } else {
      // input not needed, count down total number
      totalNumber--;
    }
  }

  return dialogValues;

  /**
   * Handles the going back in the multi-step-input.
   *
   * This will remove the last step from the taken steps and sets current step count and total number to the correct value.
   *
   * @returns the new index for the loop
   */
  function handleGoingBack(): number {
    const goToStep = steps.pop() ?? { stepNumber: 1, index: 0, totalNumber: inputs.length };
    currentStep = goToStep.stepNumber;
    totalNumber = goToStep.totalNumber;
    return goToStep.index - 1;
  }
}
