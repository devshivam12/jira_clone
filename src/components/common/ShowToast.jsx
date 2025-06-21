// import { CheckCircleIcon } from "lucide-react";

// const { toast } = require("sonner");

// const ShowToast = {
//     success: (message, options = {}) => {
//         if (options.custom) {
//             return toast.custom(options.custom, {
//                 duration: options.duration || 3000,
//                 position: options.position || 'bottom-right',
//                 ...options
//             });
//         }
//         return toast.success(message, {
//             description: options.description || '',
//             duration: options.duration || 3000,
//             position: options.position || 'bottom-right',
//             ...options
//         });
//     },
//     error: (message, options = {}) => {
//         if (options.custom) {
//             return toast.custom(options.custom, {
//                 duration: options.duration || 3000,
//                 position: options.position || 'bottom-right',
//                 ...options
//             });
//         }
//         return toast.error(message, {
//             description: options.description || '',
//             duration: options.duration || 3000,
//             position: options.position || 'bottom-right',
//             ...options
//         });
//     },
//     info: (message, options = {}) => {
//         if (options.custom) {
//             return toast.custom(options.custom, {
//                 duration: options.duration || 3000,
//                 position: options.position || 'bottom-right',
//                 ...options
//             });
//         }
//         return toast.info(message, {
//             description: options.description || '',
//             duration: options.duration || 3000,
//             position: options.position || 'bottom-right',
//             ...options
//         });
//     },
//     warning: (message, options = {}) => {
//         if (options.custom) {
//             return toast.custom(options.custom, {
//                 duration: options.duration || 3000,
//                 position: options.position || 'bottom-right',
//                 ...options
//             });
//         }
//         return toast.warning(message, {
//             description: options.description || '',
//             duration: options.duration || 3000,
//             position: options.position || 'bottom-right',
//             ...options
//         });
//     },
//     loading: (message, options = {}) => {
//         if (options.custom) {
//             return toast.custom(options.custom, {
//                 duration: options.duration || 3000,
//                 position: options.position || 'bottom-right',
//                 ...options
//             });
//         }
//         return toast.loading(message, {
//             description: options.description || '',
//             duration: options.duration || 3000,
//             position: options.position || 'bottom-right',
//             ...options
//         });
//     },
//     custom: (component, options = {}) => toast.custom(component, {
//         duration: options.duration || 3000,
//         position: options.position || 'bottom-right',
//         ...options
//     }),
//     dismissAll: () => toast.dismiss()

// }

// export default ShowToast


// const { toast } = require("sonner");

// // Predefined custom templates
// const ToastTemplates = {
//     success: (t, { title, description }) => (
//         <div className="custom-toast success">
//             <CheckCircleIcon />
//             <div className="content">
//                 {title && <h4>{title}</h4>}
//                 {description && <p>{description}</p>}
//             </div>
//             <button className="close-btn" onClick={() => toast.dismiss(t)}>×</button>
//         </div>
//     ),
//     error: (t, { title, description }) => (
//         <div className="custom-toast error">
//             <ErrorIcon />
//             <div className="content">
//                 {title && <h4>{title}</h4>}
//                 {description && <p>{description}</p>}
//             </div>
//             <button className="close-btn" onClick={() => toast.dismiss(t)}>×</button>
//         </div>
//     ),
//     info: (t, { title, description }) => (
//         <div className="custom-toast error">
//             <ErrorIcon />
//             <div className="content">
//                 {title && <h4>{title}</h4>}
//                 {description && <p>{description}</p>}
//             </div>
//             <button className="close-btn" onClick={() => toast.dismiss(t)}>×</button>
//         </div>
//     ),
//     // Add more templates for info, warning, etc.
// };

// const ShowToast = {
//     success: (message, options = {}) => {
//         if (options.useCustom) {
//             return toast.custom((t) => ToastTemplates.success(t, {
//                 title: message,
//                 description: options.description
//             }), {
//                 duration: options.duration || 3000,
//                 position: options.position || 'bottom-right',
//                 ...options
//             });
//         }
//         return toast.success(message, {
//             description: options.description || '',
//             duration: options.duration || 3000,
//             position: options.position || 'bottom-right',
//             ...options
//         });
//     },
//     error: (message, options = {}) => {
//         if (options.useCustom) {
//             return toast.custom((t) => ToastTemplates.error(t, {
//                 title: message,
//                 description: options.description
//             }), {
//                 duration: options.duration || 3000,
//                 position: options.position || 'bottom-right',
//                 ...options
//             });
//         }
//         return toast.error(message, {
//             description: options.description || '',
//             duration: options.duration || 3000,
//             position: options.position || 'bottom-right',
//             ...options
//         });
//     },
//     // ... (similar for other types)
//     custom: (component, options = {}) => toast.custom(component, {
//         duration: options.duration || 3000,
//         position: options.position || 'bottom-right',
//         ...options
//     }),
//     dismissAll: () => toast.dismiss()
// };

// export default ShowToast;

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
                return "border-gray-200 bg-white text-gray-800";
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
                return "text-gray-600";
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
    promise: toast.promise,
};

export default ShowToast;




// // Normal toast
// ShowToast.success("Success!", {
//     description: "Your action was completed successfully"
//   });
  
//   // Custom styled toast
//   ShowToast.error("Error occurred!", {
//     description: "Please try again later",
//     useCustom: true
//   });
  
//   // Loading toast with longer duration
//   ShowToast.loading("Processing...", {
//     description: "This may take a few seconds",
//     useCustom: true,
//     duration: 10000
//   });
  
//   // Fully custom toast
//   ShowToast.custom(
//     (t) => (
//       <div className="special-toast">
//         <CustomIcon />
//         <div>Special notification</div>
//         <button onClick={() => toast.dismiss(t)}>Close</button>
//       </div>
//     ),
//     { position: "top-center" }
//   );
  
//   // Promise toast
//   ShowToast.promise(
//     fetchData(),
//     {
//       loading: "Loading data...",
//       success: (data) => `Data loaded: ${data.message}`,
//       error: "Failed to load data",
//     },
//     { useCustom: true }
//   );