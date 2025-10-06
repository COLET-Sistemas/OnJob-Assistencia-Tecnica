"use client";

import { useEffect } from "react";
import { useToast } from "./ToastContainer";

/**
 * Component that listens for API forbidden errors (403) and displays them using Toast
 * This component should be included at the root layout to handle forbidden errors globally
 */
export const ForbiddenErrorHandler: React.FC = () => {
  const { showError } = useToast();

  useEffect(() => {
    // Handler function for the custom forbidden error event
    const handleForbiddenError = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string }>;
      const originalMessage =
        customEvent.detail?.message || "Acesso negado para este recurso";

      // Extract only the part after the colon if it exists
      let processedMessage = originalMessage;
      if (originalMessage.includes(":")) {
        const parts = originalMessage.split(":");
        processedMessage = parts.slice(1).join(":").trim();
      }

      showError("Acesso Negado (403)", processedMessage);
    };
    window.addEventListener("api:forbidden", handleForbiddenError);

    return () => {
      window.removeEventListener("api:forbidden", handleForbiddenError);
    };
  }, [showError]);

  return null;
};

export default ForbiddenErrorHandler;
