'use client';

import { Settings, User, Bell, Shield, Globe, Palette } from 'lucide-react';
import { useState } from 'react';

const settingsSections = [
  { id: 'profile', icon: User, label: '个人资料' },
  { id: 'notifications', icon: Bell, label: '通知设置' },
  { id: 'security', icon: Shield, label: '安全设置' },
  { id: 'language', icon: Globe, label: '语言与地区' },
  { id: 'appearance', icon: Palette, label: '外观设置' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">系统设置</h1>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0">
          <nav className="space-y-1">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <section.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{section.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-center py-16 text-gray-400">
            <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">设置面板将在此显示</p>
            <p className="text-sm mt-1">功能开发中...</p>
          </div>
        </div>
      </div>
    </div>
  );
}


