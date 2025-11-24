"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface PlanUpgradeModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const PlanUpgradeModalContext = createContext<
  PlanUpgradeModalContextType | undefined
>(undefined);

export const usePlanUpgradeModal = () => {
  const context = useContext(PlanUpgradeModalContext);
  if (context === undefined) {
    throw new Error(
      "usePlanUpgradeModal must be used within a PlanUpgradeModalProvider"
    );
  }
  return context;
};

interface PlanUpgradeModalProviderProps {
  children: ReactNode;
}

export const PlanUpgradeModalProvider: React.FC<
  PlanUpgradeModalProviderProps
> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <PlanUpgradeModalContext.Provider
      value={{
        isOpen,
        openModal,
        closeModal,
      }}
    >
      {children}
    </PlanUpgradeModalContext.Provider>
  );
};
