import React from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';

const Toast = ({ message, type, onClose }) => {
  const icons = {
    success: <FiCheckCircle className="w-5 h-5" />,
    error: <FiAlertCircle className="w-5 h-5" />,
    info: <FiInfo className="w-5 h-5" />
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  return (
    <div className={`${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between min-w-[300px]`}>
      <div className="flex items-center space-x-2">
        {icons[type]}
        <span>{message}</span>
      </div>
      <button onClick={onClose} className="hover:opacity-75">
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
