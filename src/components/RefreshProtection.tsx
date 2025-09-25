import React, { useEffect, useCallback } from 'react';
import { useAppStore } from '../store/app';

interface RefreshProtectionProps {
  children: React.ReactNode;
}

export const RefreshProtection: React.FC<RefreshProtectionProps> = ({ children }) => {
  const { 
    hasUnsavedChanges, 
    saveStateToDatabase, 
    wallet,
    setUnsavedChanges 
  } = useAppStore();

  // Auto-save data every 30 seconds if there are unsaved changes
  useEffect(() => {
    if (!wallet) return;

    const interval = setInterval(async () => {
      if (hasUnsavedChanges) {
        await saveStateToDatabase();
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, [hasUnsavedChanges, saveStateToDatabase, wallet]);

  // Handle beforeunload event
  const handleBeforeUnload = useCallback((event: BeforeUnloadEvent) => {
    if (hasUnsavedChanges && wallet) {
      // Save data before leaving
      saveStateToDatabase();
      
      // Show confirmation dialog
      const message = 'You have unsaved changes. Are you sure you want to leave?';
      event.returnValue = message;
      return message;
    }
  }, [hasUnsavedChanges, saveStateToDatabase, wallet]);

  // Handle visibility change (tab switching, minimizing)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && hasUnsavedChanges && wallet) {
      // Save data when tab becomes hidden
      saveStateToDatabase();
    }
  }, [hasUnsavedChanges, saveStateToDatabase, wallet]);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleBeforeUnload, handleVisibilityChange]);

  // Mark state as having unsaved changes when wallet connects
  useEffect(() => {
    if (wallet) {
      setUnsavedChanges(true);
    }
  }, [wallet, setUnsavedChanges]);

  return <>{children}</>;
};

export default RefreshProtection;