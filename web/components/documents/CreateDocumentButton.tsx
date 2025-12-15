'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ChevronDown, FileText, Receipt, Ticket, GitCompare } from 'lucide-react';
import type { DocType } from '@/lib/supabase';

const docTypes: { key: DocType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'bill', label: '账单', icon: Receipt },
  { key: 'quote', label: '报价单', icon: FileText },
  { key: 'ticket', label: '机票单', icon: Ticket },
  { key: 'compare', label: '比价单', icon: GitCompare },
];

export function CreateDocumentButton() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleCreate = (type: DocType) => {
    setShowMenu(false);
    router.push(`/editor?type=${type}&mode=create`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span>创建单据</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      
      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
            {docTypes.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleCreate(key)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <Icon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
