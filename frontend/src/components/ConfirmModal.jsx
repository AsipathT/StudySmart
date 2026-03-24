import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  confirmText = "Delete",
  cancelText = "Cancel",
  type = "danger" // 'danger' or 'warning' or 'info'
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />,
      iconBg: "bg-red-100",
      btnBg: "bg-red-600 hover:bg-red-700",
      focusRing: "focus:ring-red-500"
    },
    warning: {
      icon: <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />,
      iconBg: "bg-amber-100",
      btnBg: "bg-amber-600 hover:bg-amber-700",
      focusRing: "focus:ring-amber-500"
    },
    info: {
      icon: <ExclamationTriangleIcon className="w-6 h-6 text-blue-600" />,
      iconBg: "bg-blue-100",
      btnBg: "bg-blue-600 hover:bg-blue-700",
      focusRing: "focus:ring-blue-500"
    }
  };

  const config = typeConfig[type] || typeConfig.danger;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Close button */}
          <button
            type="button"
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 outline-none"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${config.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
                {config.icon}
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-xl font-bold leading-6 text-gray-900" id="modal-title">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm sm:w-auto transition-colors ${config.btnBg} ${config.focusRing} focus:outline-none focus:ring-2 focus:ring-offset-2`}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-colors"
              onClick={onClose}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
