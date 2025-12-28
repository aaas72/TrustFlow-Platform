type Props = {
  active: boolean;
  className?: string;
  overlay?: boolean;
  barClassName?: string;
  overlayClassName?: string;
};

export default function TopBarLoader({
  active,
  className = "",
  overlay = true,
  barClassName = "h-[4px] bg-gray-200",
  overlayClassName = "bg-white/80 backdrop-blur-sm",
}: Props) {
  if (!active) return null;
  return (
    <>
      <div
        className={`absolute inset-0 z-50 ${
          overlay ? overlayClassName : ""
        } ${className}`}
      >
        <div
          className={`absolute top-0 left-0 right-0 overflow-hidden ${barClassName}`}
        >
          <div
            className="absolute inset-y-0 left-0 w-1/4 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #2563eb 0%, #22c55e 50%, #f59e0b 100%)",
              animation: "topbar-slide 0.6s linear infinite",
            }}
          />
        </div>
      </div>
      <style>{`@keyframes topbar-slide { 0% { transform: translateX(-30%); } 100% { transform: translateX(130%); } }`}</style>
    </>
  );
}
