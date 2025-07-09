
import { toast } from "sonner";
import { CheckCircle2, XCircle, Info, AlertCircle, Loader2, X } from "lucide-react";
import React from "react";

const ToastTemplate = ({ t, title, description, icon, type, options }) => {
    const getTypeStyles = () => {
        switch (type) {
            case "success":
                return "border-green-200 bg-green-50 text-green-800";
            case "error":
                return "border-red-200 bg-red-50 text-red-800";
            case "info":
                return "border-blue-200 bg-blue-50 text-blue-800";
            case "warning":
                return "border-yellow-200 bg-yellow-50 text-yellow-800";
            case "loading":
                return "border-yellow-200 bg-yellow-50 text-yellow-800";
            case "promise":
                return "border-yellow-200 bg-yellow-50 text-yellow-800"
            default:
                return "border-gray-200 bg-white text-gray-800";
        }
    };

    const getIconStyles = () => {
        switch (type) {
            case "success":
                return "text-green-600";
            case "error":
                return "text-red-600";
            case "info":
                return "text-blue-600";
            case "warning":
                return "text-yellow-600";
            case "loading":
                return "text-yellow-600";
            default:
                return "text-gray-600";
        }
    };

    return (
        <div className={`
            relative flex items-start gap-3 p-4 rounded-lg border shadow-lg
            min-w-[320px] max-w-md mx-auto
            backdrop-blur-sm
            transform transition-all duration-200 ease-in-out
            hover:shadow-xl
            ${getTypeStyles()}
            ${options?.className || ""}
        `}>
            {/* Icon */}
            <div className={`flex-shrink-0 mt-0.5 ${getIconStyles()}`}>
                {icon || (
                    <>
                        {type === "success" && <CheckCircle2 size={20} />}
                        {type === "error" && <XCircle size={20} />}
                        {type === "info" && <Info size={20} />}
                        {type === "warning" && <AlertCircle size={20} />}
                        {type === "loading" && <Loader2 size={20} className="animate-spin" />}
                    </>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {title && (
                    <h4 className="text-sm font-semibold leading-5 mb-1 pr-2">
                        {title}
                    </h4>
                )}
                {description && (
                    <p className="text-sm opacity-90 leading-relaxed pr-2">
                        {description}
                    </p>
                )}
            </div>

            {/* Close Button */}
            <button
                className="flex-shrink-0 ml-2 p-1 rounded-md hover:bg-black/10 transition-colors duration-150 opacity-60 hover:opacity-100"
                onClick={() => toast.dismiss(t)}
                aria-label="Close notification"
            >
                <X size={16} />
            </button>
        </div>
    );
};

const showCustomToast = (type, message, options) => {
    return toast.custom(
        (t) => (
            <ToastTemplate
                t={t}
                title={message}
                description={options?.description}
                type={type}
                options={options}
            />
        ),
        {
            duration: options?.duration || 4000,
            position: options?.position || "bottom-right",
            ...options,
        }
    );
};

const ShowToast = {
    success: (message, options) => {
        return options?.useCustom
            ? showCustomToast("success", message, options)
            : toast.success(message, {
                description: options?.description || "",
                duration: options?.duration || 4000,
                position: options?.position || "bottom-right",
                ...options,
            });
    },
    error: (message, options) => {
        return options?.useCustom
            ? showCustomToast("error", message, options)
            : toast.error(message, {
                description: options?.description || "",
                duration: options?.duration || 4000,
                position: options?.position || "bottom-right",
                ...options,
            });
    },
    info: (message, options) => {
        return options?.useCustom
            ? showCustomToast("info", message, options)
            : toast.info(message, {
                description: options?.description || "",
                duration: options?.duration || 4000,
                position: options?.position || "bottom-right",
                ...options,
            });
    },
    warning: (message, options) => {
        return options?.useCustom
            ? showCustomToast("warning", message, options)
            : toast.warning(message, {
                description: options?.description || "",
                duration: options?.duration || 4000,
                position: options?.position || "bottom-right",
                ...options,
            });
    },
    loading: (message, options) => {
        return options?.useCustom
            ? showCustomToast("loading", message, { ...options, duration: options?.duration || 0 })
            : toast.loading(message, {
                description: options?.description || "",
                duration: options?.duration || 0,
                position: options?.position || "bottom-right",
                ...options,
            });
    },
    custom: (component, options) =>
        toast.custom(component, {
            duration: options?.duration || 4000,
            position: options?.position || "bottom-right",
            ...options,
        }),
    dismissAll: () => toast.dismiss(),
    promise: (promise, options) => {
        const loadingToast = ShowToast.loading(options?.loading || 'Processing...', {
            description: options?.loadingDescription,
            useCustom: true,
            duration: 0
        });

        return promise
            .then(data => {
                toast.dismiss(loadingToast);
                if (options?.success) {
                    ShowToast.success(
                        typeof options?.success === 'function' ? options.success(data) : (options?.success || 'Success!'),
                        {
                            description: options?.successDescription,
                            useCustom: true
                        }
                    );
                }
                return data;
            })
            .catch(error => {
                toast.dismiss(loadingToast);
                if (options?.error) {
                    ShowToast.error(
                        typeof options?.error === 'function' ? options.error(error) : (options?.error || 'Error occurred'),
                        {
                            description: error.message || options?.errorDescription,
                            useCustom: true
                        }
                    );
                }
                throw error;
            });
    }
};

export default ShowToast;


