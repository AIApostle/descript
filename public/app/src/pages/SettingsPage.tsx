import React, { useState } from 'react';
import { Monitor, Moon, Save, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TextField } from '../components/ui/TextField';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useTheme, type ThemeMode } from '../context/ThemeContext';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { mode, setTheme } = useTheme();
  const { showToast } = useNotification();

  const [name, setName] = useState(user?.name || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUser({
        name: name.trim() || undefined,
        organization: organization.trim() || undefined,
      });
      showToast('Controller profile updated', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const themeOptions: Array<{ value: ThemeMode; label: string; icon: React.ReactNode }> = [
    { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
    { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout title="Workspace Settings" subtitle="Manage your controller profile and theme preferences.">
      <div className="max-w-2xl space-y-6">
        <Card title="Controller Profile">
          <form onSubmit={handleSave} className="space-y-4">
            <TextField label="Email Address" value={user?.email || ''} disabled />
            <TextField
              label="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Elena Vance"
            />
            <TextField
              label="Organization (optional)"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Bytecraft Labs"
            />
            <div className="flex justify-end">
              <Button type="submit" loading={saving} icon={<Save className="h-4 w-4" />}>
                Save Profile
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Appearance" subtitle="Choose how Descript renders across dashboard and Bytecript cards.">
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-colors ${
                  mode === opt.value
                    ? 'border-descript-600 bg-descript-50 text-descript-700 dark:bg-descript-950/60 dark:text-descript-300'
                    : 'border-base-200 dark:border-base-800 text-base-700 dark:text-base-300 hover:bg-base-50 dark:hover:bg-base-800'
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Python SDK Access" subtitle="Manage API tokens for programmatic registration and verification.">
          <Link
            to="/developers"
            className="inline-flex items-center gap-2 text-sm font-semibold text-descript-600 dark:text-descript-400 hover:underline"
          >
            Open Developer API Keys & Python SDK Docs
          </Link>
        </Card>
      </div>
    </DashboardLayout>
  );
}
