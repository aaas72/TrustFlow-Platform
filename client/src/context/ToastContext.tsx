import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const TOAST_DURATION = 3000; // 3 seconds

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300); // Wait for animation to finish
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <FiAlertCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <FiAlertCircle className="w-5 h-5 text-yellow-500" />;
      case "info":
        return <FiInfo className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-white border-green-500";
      case "error":
        return "bg-white border-red-500";
      case "warning":
        return "bg-white border-yellow-500";
      case "info":
        return "bg-white border-blue-500";
    }
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 
        transform transition-all duration-300 ease-in-out mb-3
        ${getStyles()}
        ${
          isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
        }
      `}
      role="alert"
    >
      <div className="shrink-0">{getIcon()}</div>
      <p className="text-sm font-medium text-gray-800">{toast.message}</p>
      <button
        onClick={handleClose}
        className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (message: string) => showToast(message, "success"),
    [showToast]
  );
  const error = useCallback(
    (message: string) => showToast(message, "error"),
    [showToast]
  );
  const info = useCallback(
    (message: string) => showToast(message, "info"),
    [showToast]
  );
  const warning = useCallback(
    (message: string) => showToast(message, "warning"),
    [showToast]
  );
  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end max-w-sm w-full pointer-events-none">
        <div className="pointer-events-auto">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};
