import React, { useEffect } from "react";

interface ModalProps {
  message: string;
  onClose: () => void;
  children?: React.ReactNode; 
}

const Modal: React.FC<ModalProps> = ({ message, onClose, children }) => {
  useEffect(() => {
    // Automatically close the modal after 800 milliseconds
    const timer = setTimeout(() => {
      onClose();
    }, 2000);

    // Clear the timer if the component unmounts before 800 milliseconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg p-4">
      <>
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-30"></div>
          <div className="relative bg-gray-900 text-white px-6 py-4 rounded-lg shadow-xl border border-gray-800 backdrop-blur-md flex items-center space-x-3 max-w-md">
            <p>{message}</p>
            {children && <div className="mt-2">{children}</div>}
          </div>
        </div>
      </>
    </div>
  );
};

export default Modal;
