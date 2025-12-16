'use client';

import type { DocType } from '@/lib/supabase';

interface Tab {
  key: DocType | 'all';
  label: string;
}

const tabs: Tab[] = [
  { key: 'all', label: '全部' },
  { key: 'bill', label: '账单' },
  { key: 'quote', label: '报价单' },
  { key: 'ticket', label: '机票单' },
  { key: 'compare', label: '比价单' },
];

interface DocumentTabsProps {
  activeTab: DocType | 'all';
  onTabChange: (tab: DocType | 'all') => void;
  counts?: Record<string, number>;
}

export function DocumentTabs({ activeTab, onTabChange, counts }: DocumentTabsProps) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === tab.key
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tab.label}
          {counts && counts[tab.key] !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-500'
            }`}>
              {counts[tab.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}


