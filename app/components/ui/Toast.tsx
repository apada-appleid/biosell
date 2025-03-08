import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiX, FiAlertCircle } from 'react-icons/fi';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  actionButtons?: Array<{
    label: string;
    onClick: () => void;
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
  const handleClose = () => {
    setIsExiting(true);
    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  // Auto-hide after 5 seconds if not closed manually
  useEffect(() => {
    if (isVisible) {
      const timeout = setTimeout(() => {
        handleClose();
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [isVisible]);
  
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
        return <FiAlertCircle className="text-red-500 mr-2 h-5 w-5 flex-shrink-0" />;
      case 'info':
        return <FiAlertCircle className="text-blue-500 mr-2 h-5 w-5 flex-shrink-0" />;
      case 'success':
      default:
        return <FiCheckCircle className="text-green-500 mr-2 h-5 w-5 flex-shrink-0" />;
    }
  };

  return (
    <div 
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-y-[-20px]' : 'opacity-100 translate-y-0'
      }`}
      aria-live="assertive"
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center">
            {getIconByType()}
            <p className="text-gray-800 text-sm md:text-base">{message}</p>
          </div>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-700 ml-2 flex-shrink-0"
            aria-label="بستن"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClose()}
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        
        {actionButtons && actionButtons.length > 0 && (
          <div className="flex justify-end flex-wrap space-x-2 rtl:space-x-reverse mt-2 gap-2">
            {actionButtons.map((button, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  // Call the button's click handler and close the toast
                  button.onClick();
                  handleClose();
                }}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && (button.onClick(), handleClose())}
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