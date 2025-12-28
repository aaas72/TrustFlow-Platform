import React from "react";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string; // Örn: "blue", "green", "yellow"...
}

// Renk paletini Tailwind ile güvenli şekilde eşleyen sabit harita
const PALETTE: Record<string, { border: string; text: string; from: string; to: string; icon: string }> = {
  blue:   { border: "border-blue-200 hover:border-blue-400",   text: "text-blue-700",   from: "from-blue-400",   to: "to-blue-600",   icon: "text-blue-600" },
  green:  { border: "border-green-200 hover:border-green-400", text: "text-green-700",  from: "from-green-400",  to: "to-green-600",  icon: "text-green-600" },
  yellow: { border: "border-yellow-200 hover:border-yellow-400", text: "text-yellow-700", from: "from-yellow-400", to: "to-yellow-600", icon: "text-yellow-600" },
  purple: { border: "border-purple-200 hover:border-purple-400", text: "text-purple-700", from: "from-purple-400", to: "to-purple-600", icon: "text-purple-600" },
  indigo: { border: "border-indigo-200 hover:border-indigo-400", text: "text-indigo-700", from: "from-indigo-400", to: "to-indigo-600", icon: "text-indigo-600" },
  sky:    { border: "border-sky-200 hover:border-sky-400",     text: "text-sky-700",    from: "from-sky-400",    to: "to-sky-600",    icon: "text-sky-600" },
  orange: { border: "border-orange-200 hover:border-orange-400", text: "text-orange-700", from: "from-orange-400", to: "to-orange-600", icon: "text-orange-600" },
  rose:   { border: "border-rose-200 hover:border-rose-400",   text: "text-rose-700",   from: "from-rose-400",   to: "to-rose-600",   icon: "text-rose-600" },
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const c = PALETTE[color] || PALETTE.blue;

  return (
    <div
      className={
        `relative overflow-hidden rounded-xl border ${c.border} bg-white/80 backdrop-blur-sm ` +
        `p-5 transition-all duration-300 group hover:shadow-lg hover:-translate-y-0.5`
      }
    >
      {/* Üst vurgu çizgisi kaldırıldı */}

      {/* Köşede soft gradient dairesel vurgu (dekoratif) */}
      <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br ${c.from} ${c.to} opacity-20 blur-2xl pointer-events-none`} />

      <div className="flex items-center">
        {/* İkon: arka plan olmadan, doğrudan renkli */}
        <span className={`text-2xl ${c.icon}`}>
          {icon}
        </span>

        {/* Metinler: değer ve başlık */}
        <div className="ml-4">
          <h3 className={`text-xl font-bold ${c.text}`}>{value}</h3>
          <p className="text-gray-600 font-medium">{title}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
