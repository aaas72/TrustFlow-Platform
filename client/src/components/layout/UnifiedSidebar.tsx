import React from 'react';
  import type { ReactNode } from 'react';

interface SidebarItem {
  key: string;
  label: string;
  icon: ReactNode;
}

interface UnifiedSidebarProps {
  title: string;
  items: SidebarItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({ title, items, activeTab, onTabChange }) => {
  return (
    <div className="bg-white h-screen fixed left-0 top-0 w-55 border-r border-gray-200">
      <div className="flex flex-col py-2">
        <div className="px-6 py-4">
          <h3 className="text-blue-600 text-lg font-bold">{title}</h3>
        </div>

        {items.map((item) => (
          <button
            key={item.key}
            className={`flex items-center py-3 px-6 ${
              activeTab === item.key ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => onTabChange(item.key)}
          >
            <span className={`mr-3 ${activeTab === item.key ? 'text-blue-600' : 'text-gray-500'}`}>{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default UnifiedSidebar;