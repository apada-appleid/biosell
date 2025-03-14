import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, X, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  actionButtons?: Array<{
    label: string;
    onClick: () => void;
    autoDismiss?: boolean;
  }>;
  type?: 'success' | 'error' | 'info';
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  isVisible, 
  onClose, 
  actionButtons,
  type = 'success' 
}) => {
  const [isExiting, setIsExiting] = useState(false);
  
  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsExiting(true);
    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  }, [onClose]);

  // Auto-hide after 8 seconds if not closed manually
  useEffect(() => {
    if (isVisible) {
      const timeout = setTimeout(() => {
        handleClose();
      }, 8000);
      
      return () => clearTimeout(timeout);
    }
  }, [isVisible, handleClose]);
  
  // Reset exit animation when toast becomes visible
  useEffect(() => {
    if (isVisible) {
      setIsExiting(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;
  
  const getIconByType = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="text-red-500 h-5 w-5 flex-shrink-0 ml-2 rtl:ml-2 rtl:mr-0" />;
      case 'info':
        return <AlertCircle className="text-blue-500 h-5 w-5 flex-shrink-0 ml-2 rtl:ml-2 rtl:mr-0" />;
      case 'success':
      default:
        return <CheckCircle className="text-green-500 h-5 w-5 flex-shrink-0 ml-2 rtl:ml-2 rtl:mr-0" />;
    }
  };

  return (
    <div 
      className={`fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-y-[20px]' : 'opacity-100 translate-y-0'
      }`}
      aria-live="assertive"
    >
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Toast Message */}
        <div className="p-4 flex items-start justify-between">
          <div className="flex items-center">
            {getIconByType()}
            <p className="text-gray-800 text-sm">{message}</p>
          </div>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-700 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0"
            aria-label="بستن"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClose()}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Action Buttons */}
        {actionButtons && actionButtons.length > 0 && (
          <div className="flex border-t border-gray-100">
            {actionButtons.map((button, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  button.onClick();
                  if (button.autoDismiss !== false) {
                    handleClose();
                  }
                }}
                className={`flex-1 py-3 text-center font-medium text-sm transition-colors
                  ${index === 0 
                    ? "text-white bg-blue-500 hover:bg-blue-600" 
                    : "text-blue-500 bg-white hover:bg-gray-50"}
                  ${index !== 0 ? "border-r border-gray-100 rtl:border-r-0 rtl:border-l" : ""}
                `}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && (
                  button.onClick(), 
                  button.autoDismiss !== false && handleClose()
                )}
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