import React from 'react';
import { useAppStore } from '../store/app';
import { Save, RefreshCw, AlertTriangle } from 'lucide-react';

export const DataSyncStatus: React.FC = () => {
  const { 
    hasUnsavedChanges, 
    saveStateToDatabase, 
    restoreStateFromDatabase,
    wallet 
  } = useAppStore();

  if (!wallet) return null;

  const handleSave = async () => {
    try {
      await saveStateToDatabase();
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  const handleRefresh = async () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Refreshing will lose them. Do you want to save first?'
      );
      if (confirmed) {
        await handleSave();
      }
    }
    
    try {
      await restoreStateFromDatabase();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 flex gap-2 z-50">
      {hasUnsavedChanges && (
        <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900 px-3 py-2 rounded-lg border border-yellow-300 dark:border-yellow-700">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm text-yellow-800 dark:text-yellow-200">
            Unsaved changes
          </span>
        </div>
      )}
      
      <button
        onClick={handleSave}
        disabled={!hasUnsavedChanges}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors"
        title="Save data to database"
      >
        <Save className="h-4 w-4" />
        <span className="text-sm">Save</span>
      </button>
      
      <button
        onClick={handleRefresh}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors"
        title="Refresh data from database"
      >
        <RefreshCw className="h-4 w-4" />
        <span className="text-sm">Refresh</span>
      </button>
    </div>
  );
};

export default DataSyncStatus;