/**
 * Utility functions for handling 403 Forbidden errors
 */

/**
 * Function to test the 403 error handling without making an API call
 * This is useful for testing the error handling in development
 */
export const testForbiddenError = (message?: string) => {
  if (typeof window === "undefined") {
    return;
  }

  // Dispatch a custom event to simulate a 403 error from the API
  window.dispatchEvent(
    new CustomEvent("api:forbidden", {
      detail: {
        message: message || "Este é um teste de erro 403 de acesso negado",
      },
    })
  );
};

/**
 * Check if a caught error is a ForbiddenError (403)
 */
export const isForbiddenError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.name === "ForbiddenError";
  }
  return false;
};
