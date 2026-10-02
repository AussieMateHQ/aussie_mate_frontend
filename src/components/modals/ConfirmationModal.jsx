import React, { useEffect } from 'react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  children,
  confirmText = "Confirm", 
  cancelText = "Cancel",
  confirmButtonColor = "bg-[#EF4444] hover:bg-red-600",
  isLoading = false,
  errorMessage,
  autoCloseAfter = 0,
  centerTitle = true,
  centerMessage = true
}) => {
  // This hook must run on every render, before the `if (!isOpen)` early
  // return below - otherwise toggling isOpen (the modal's whole purpose)
  // changes how many hooks get called between renders of the same mounted
  // instance, and React throws "Rendered more/fewer hooks than expected",
  // crashing whatever page the modal is on.
  useEffect(() => {
    if (isOpen && errorMessage && autoCloseAfter > 0) {
      const t = setTimeout(onClose, autoCloseAfter);
      return () => clearTimeout(t);
    }
  }, [isOpen, errorMessage, autoCloseAfter, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-xs sm:max-w-sm shadow-custom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        {title && (
          <h3 className={`text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 ${centerTitle ? 'text-center' : ''}`}>
            {title}
          </h3>
        )}
        
        {/* Message */}
        {message && (
          <p className={`text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 ${centerMessage ? 'text-center' : ''} leading-relaxed`}>
            {message}
          </p>
        )}

        {children}

        {errorMessage && (
          <div className="mb-4 sm:mb-6 text-center">
            <span className="text-sm text-red-600 font-medium">{errorMessage}</span>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 ${confirmButtonColor} text-white font-medium py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
