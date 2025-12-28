import { FiRefreshCw } from "react-icons/fi";

type LoaderProps = {
  text?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
};

export default function Loader({
  text = "Yükleniyor...",
  size = "md",
  fullScreen = false,
  overlay = true,
  className = "",
}: LoaderProps) {
  const sizeClass = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-6 w-6";

  const content = (
    <div className={`inline-flex items-center gap-3 ${className}`} role="status" aria-live="polite">
      <FiRefreshCw className={`${sizeClass} animate-spin text-blue-600`} />
      {text && <span className="text-blue-700 font-semibold text-sm">{text}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[1000px] flex items-center justify-center">
        {overlay && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" aria-hidden="true" />}
        <div className="relative z-10">{content}</div>
      </div>
    );
  }

  return content;
}