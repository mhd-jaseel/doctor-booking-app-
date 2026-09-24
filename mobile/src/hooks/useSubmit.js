import { useState, useCallback, useRef } from 'react';
import { useAppAlert } from '../components/common/AppAlert';
import { getErrorMessage } from '../utils/errorHandler';

/**
 * useSubmit:
 * Reusable hook to handle single-flight action execution with instant lock,
 * SweetAlert feedback, and guaranteed reset on completion or failure.
 */
export const useSubmit = (defaultSuccessTitle = 'Success', defaultErrorTitle = 'Action Failed') => {
  const [submitting, setSubmitting] = useState(false);
  const isLockedRef = useRef(false);
  const { showSuccess, showError, showWarning } = useAppAlert();

  const submit = useCallback(
    async ({
      action,
      successTitle = defaultSuccessTitle,
      successMessage,
      errorTitle = defaultErrorTitle,
      errorMessage,
      onSuccess,
      onError,
      silentSuccess = false,
      validationError,
    }) => {
      // If validation error passed
      if (validationError) {
        showWarning(validationError, 'Validation Error');
        return { success: false, error: validationError };
      }

      // Synchronous double-click guard
      if (isLockedRef.current || submitting) {
        return { success: false, busy: true };
      }

      isLockedRef.current = true;
      setSubmitting(true);

      try {
        const result = await action();

        if (!silentSuccess && successMessage) {
          showSuccess(successMessage, successTitle);
        }

        if (onSuccess) {
          await onSuccess(result);
        }

        return { success: true, result };
      } catch (err) {
        const readableMsg = errorMessage || getErrorMessage(err);

        // If onError is provided, let the caller handle the error display.
        // Otherwise, show the default error alert.
        if (onError) {
          await onError(err);
        } else {
          showError(readableMsg, errorTitle);
        }

        return { success: false, error: err };
      } finally {
        isLockedRef.current = false;
        setSubmitting(false);
      }
    },
    [submitting, defaultSuccessTitle, defaultErrorTitle, showSuccess, showError, showWarning]
  );

  return {
    submitting,
    submit,
  };
};
