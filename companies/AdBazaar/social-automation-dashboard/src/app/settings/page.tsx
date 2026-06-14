'use client';

import { useState } from 'react';
import { Settings, Bell, Shield, Clock, Palette, Save } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    refreshInterval: 30,
    darkMode: true,
    notifications: true,
    soundAlerts: false,
    autoRefresh: true,
  });

  const stats = {
    totalServices: 20,
    onlineCount: 0,
    offlineCount: 20,
  };

  const handleSave = () => {
    localStorage.setItem('dashboard-settings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

  return (
    <>
      <Sidebar stats={stats} />
      <main className="flex-1 overflow-auto bg-slate-950">
        <header className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-sm text-slate-400 mt-1">Configure dashboard preferences</p>
          </div>
        </header>

        <div className="px-6 py-6 max-w-3xl">
          <div className="space-y-6">
            {/* General Settings */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">General Settings</h2>
                  <p className="text-sm text-slate-400">Basic dashboard configuration</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Auto Refresh</p>
                    <p className="text-xs text-slate-400">Automatically check service health</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, autoRefresh: !settings.autoRefresh })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.autoRefresh ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.autoRefresh ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Refresh Interval</p>
                    <p className="text-xs text-slate-400">How often to check services (seconds)</p>
                  </div>
                  <select
                    value={settings.refreshInterval}
                    onChange={(e) => setSettings({ ...settings, refreshInterval: Number(e.target.value) })}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={15}>15 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute</option>
                    <option value={120}>2 minutes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Notifications</h2>
                  <p className="text-sm text-slate-400">Alert and notification preferences</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Push Notifications</p>
                    <p className="text-xs text-slate-400">Get notified when services go offline</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.notifications ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.notifications ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Sound Alerts</p>
                    <p className="text-xs text-slate-400">Play sound when status changes</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, soundAlerts: !settings.soundAlerts })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.soundAlerts ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.soundAlerts ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Appearance Settings */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-pink-600/20 rounded-lg flex items-center justify-center">
                  <Palette className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Appearance</h2>
                  <p className="text-sm text-slate-400">Customize the dashboard look</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Dark Mode</p>
                    <p className="text-xs text-slate-400">Use dark theme</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings.darkMode ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.darkMode ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}