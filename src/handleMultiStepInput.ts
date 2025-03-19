import { LinkList, LinkListIterator } from "@js-sdsl/link-list";
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
export function initializeLogger(pLogger: Logger): void {
  logger = pLogger;
}

/**
 * Handles a multi-step input. All the inputs will be progressed in order.
 * If any input comes back as undefined, then an information message will be shown to the user
 * and nothing will be returned.
 *
 * @param title - the title for the multi step input
 * @param inputs - the inputs that should be progressed
 * @param dialogValues - the dialog values with any values that were given before the multi-step-input was called.
 * @returns the dialog values from the inputs
 */
export async function handleMultiStepInput(
  title: string,
  inputs: InputBase<InputBaseOptions>[],
  dialogValues?: DialogValues
): Promise<DialogValues | undefined> {
  dialogValues = dialogValues ?? new DialogValues();

  let currentStep: Step = { stepNumber: 1, totalNumber: inputs.length };

  const takenSteps: Step[] = [];

  // iterate over the inputs with a link list
  const inputList = new LinkList(inputs);
  const iterator = inputList.begin();

  while (iterator.isAccessible()) {
    const stepResult = await handleInputStep(dialogValues, title, iterator, takenSteps, currentStep);

    if (!stepResult) {
      return;
    }

    currentStep = stepResult;
  }

  return dialogValues;
}

/**
 * Handles the input of one step.
 *
 * @param dialogValues - the current dialog values
 * @param title - the title for the multi step input
 * @param iterator - the iterator for stepping forward and backward in the steps
 * @param takenSteps - the already taken steps
 * @param currentStep - the current step
 * @returns the next step that should be taken
 */
async function handleInputStep(
  dialogValues: DialogValues,
  title: string,
  iterator: LinkListIterator<InputBase<InputBaseOptions>>,
  takenSteps: Step[],
  currentStep: Step
): Promise<Step | undefined> {
  // get the current input from the iterator
  const input = iterator.pointer;

  // check if input is needed
  if (input.inputOptions.onBeforeInput?.(dialogValues) ?? true) {
    // if needed, then show dialog
    const result = await input.showDialog(
      dialogValues,
      generateStepOutput(title, currentStep.stepNumber, currentStep.totalNumber),
      currentStep.stepNumber !== 1
    );

    // dispose everything no longer needed from the input
    input.dispose();

    if (typeof result === "undefined") {
      // User canceled the selection
      logger.debug({ message: `Command ${input.inputOptions.name} was cancelled` });
      return;
    } else if (result === InputAction.BACK) {
      // if the back button was pressed, set index and step counter to the last valid used elements
      return handleGoingBack(takenSteps, currentStep, iterator);
    } else {
      currentStep.goingBackProcess = false;

      dialogValues.addValue(input.inputOptions.name, result);

      // if there is some special behavior after the input, handle it
      input.inputOptions.onAfterInput?.(dialogValues);

      // save the last valid step for going back
      takenSteps.push({
        stepNumber: currentStep.stepNumber,
        totalNumber: currentStep.totalNumber,
        name: input.inputOptions.name,
      });

      currentStep.stepNumber++;
    }
  } else if (!currentStep.goingBackProcess) {
    // input not needed, count down total number
    currentStep.totalNumber--;
  }

  if (currentStep.goingBackProcess) {
    // if we are going back and skipping, then just go back one more step
    return handleGoingBack(takenSteps, currentStep, iterator);
  } else {
    // otherwise, get the next input
    iterator.next();
    return currentStep;
  }
}

/**
 * Generate a step output that will read `(Step <current> of <maximum>)`.
 * This should be included in the title of the dialogs.
 *
 * @param title - the general title of the input
 * @param currentStep - the current step number of the dialog
 * @param maximumStep - the maximum step number of the dialog
 * @returns the step output
 */
function generateStepOutput(title: string, currentStep: number, maximumStep: number): string {
  return `${title} (Step ${currentStep} of ${maximumStep})`;
}

/**
 * Handles the going back in the multi-step-input.
 *
 * This will remove the last step from the taken steps and sets current step count and total number to the correct value.
 *
 * @param takenSteps - the already taken steps
 * @param currentStep - the current step
 * @param iterator - the iterator for stepping forward and backward in the steps
 * @returns the step that should be taken when going back. If there is no going back is possible, then the current step will be returned.
 */
function handleGoingBack(
  takenSteps: Step[],
  currentStep: Step,
  iterator: LinkListIterator<InputBase<InputBaseOptions>>
): Step {
  const goToStep = takenSteps.pop();

  if (goToStep?.name) {
    // if there is a last step
    const lastStep: Step = { ...goToStep, goingBackProcess: true };

    let element = iterator.pointer;

    // go back until the name is the same as the name of the last step
    while (element.inputOptions.name !== goToStep.name) {
      iterator = iterator.pre();
      element = iterator.pointer;
    }

    return lastStep;
  } else {
    return currentStep;
  }
}

/**
 * The step that was taken in the multi-step-input.
 */
type Step = {
  /**
   * The name of the current input element.
   */
  name?: string;

  /**
   * The current number of the step.
   */
  stepNumber: number;

  /**
   * The total number of all steps.
   */
  totalNumber: number;

  /**
   * Information, if the step process is currently going back.
   */
  goingBackProcess?: boolean;
};
