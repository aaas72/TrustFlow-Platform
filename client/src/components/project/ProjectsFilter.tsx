import { FiFilter, FiX } from "react-icons/fi";

export type TimeFilter = "any" | "today" | "7d" | "30d";

export interface FilterValue {
  name: string;
  domain: string; // Beceri/alan adı
  time: TimeFilter;
}

interface ProjectsFilterProps {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
  domains?: string[]; // Mevcut projelerden türetilmiş alanlar (skill names)
}

export default function ProjectsFilter({ value, onChange, domains = [] }: ProjectsFilterProps) {
  const set = (patch: Partial<FilterValue>) => onChange({ ...value, ...patch });

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-800">
          <FiFilter className="text-blue-600" />
          <span className="font-semibold">Filtreler</span>
        </div>
        <button
          type="button"
          onClick={() => onChange({ name: "", domain: "", time: "any" })}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <FiX />
          Temizle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ada göre arama */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ada göre</label>
          <input
            type="text"
            value={value.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Proje adı ile ara"
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Alan/Kategori seçimi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alan</label>
          <select
            value={value.domain}
            onChange={(e) => set({ domain: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tümü</option>
            {domains.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Zaman filtresi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zaman</label>
          <select
            value={value.time}
            onChange={(e) => set({ time: e.target.value as TimeFilter })}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="any">Tümü</option>
            <option value="today">Bugün</option>
            <option value="7d">Son 7 gün</option>
            <option value="30d">Son 30 gün</option>
          </select>
        </div>
      </div>
    </div>
  );
}