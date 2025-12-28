import { NavLink } from "react-router-dom";
import {
  FiFileText,
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiClock,
  FiStar
} from "react-icons/fi";

interface ProjectTabsProps {
  projectId: string;
  basePath?: string; // e.g. "/freelancer/projects"
  className?: string;
}

export default function ProjectTabs({ projectId, basePath = "/freelancer/projects", className }: ProjectTabsProps) {
  const root = `${basePath}/${projectId}`;
  const tabs = [
    { key: "", label: "Genel Bakış", icon: <FiFileText /> },
    { key: "plan", label: "Plan", icon: <FiCalendar /> },
    { key: "milestones", label: "Aşamalar", icon: <FiCheckCircle /> },
    { key: "timeline", label: "Zaman Çizelgesi", icon: <FiClock /> },
    { key: "payments", label: "Ödemeler", icon: <FiDollarSign /> },
    { key: "reviews", label: "Değerlendirmeler", icon: <FiStar /> },
  ];

  return (
    <div className={`bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-wrap gap-2 ${className ?? ""}`.trim()}>
      {tabs.map((t) => (
        <NavLink
          key={t.key}
          to={`${root}${t.key ? `/${t.key}` : ""}`}
          end={t.key === ""}
          className={({ isActive }) =>
            `flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`
          }
        >
          <span className="text-lg">{t.icon}</span>
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}