import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiX } from 'react-icons/fi';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  actionButtons?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose, actionButtons }) => {
  // Auto-hide after 5 seconds if not closed manually
  useEffect(() => {
    if (isVisible) {
      const timeout = setTimeout(() => {
        onClose();
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center">
            <FiCheckCircle className="text-green-500 mr-2 h-5 w-5" />
            <p className="text-gray-800">{message}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="بستن"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        
        {actionButtons && actionButtons.length > 0 && (
          <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-2">
            {actionButtons.map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                {button.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Toast; 