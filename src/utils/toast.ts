interface ToastOptions {
  duration?: number;
  position?: "top-right" | "bottom-right" | "center" | "bottom-center";
}

export function showToast(
  message: string,
  type: "success" | "error" = "success",
  options: ToastOptions = {}
) {
  const { duration = 3000, position = "top-right" } = options;

  const toast = document.createElement("div");
  toast.className = `fixed z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-normal transition-all duration-300 transform`;

  // Position styles
  if (position === "center") {
    toast.className += ` top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[280px] max-w-[320px] text-center`;
  } else if (position === "top-right") {
    toast.className += ` top-4 right-4 min-w-[280px] max-w-[320px]`;
  } else if (position === "bottom-right") {
    toast.className += ` bottom-4 right-4 min-w-[280px] max-w-[320px]`;
  } else if (position === "bottom-center") {
    toast.className += ` bottom-4 left-1/2 -translate-x-1/2 min-w-[280px] max-w-[320px] text-center`;
  }

  // Color styles
  toast.className += type === "success" ? ` bg-green-500` : ` bg-red-500`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, duration);
}
