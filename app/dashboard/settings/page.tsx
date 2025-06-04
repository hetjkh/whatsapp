"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings,
  Bell,
  Shield,
  Save,
  User,
  Mail,
  Lock,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState({
    notifications: true,
    autoReconnect: true,
    darkMode: true,
    messageSound: true
  });
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://bulkwhasapp-backend.onrender.com/api/settings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        if (data.status) {
          setSettings(data.data.settings);
          setUser(data.data.user);
          setFormData({
            ...formData,
            name: data.data.user.name,
            email: data.data.user.email
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

  const handleSettingChange = async (key: string, value: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://bulkwhasapp-backend.onrender.com/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          [key]: value
        })
      });

      const data = await response.json();
      if (data.status) {
        setSettings(prev => ({ ...prev, [key]: value }));
      }
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://bulkwhasapp-backend.onrender.com/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email
        })
      });

      const data = await response.json();
      if (data.status) {
        setStatus('Profile updated successfully');
        setUser(data.data.user);
      } else {
        setStatus('Failed to update profile: ' + data.message);
      }
    } catch (error) {
      setStatus('Error updating profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://bulkwhasapp-backend.onrender.com/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();
      if (data.status) {
        setStatus('Password updated successfully');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: ''
        }));
      } else {
        setStatus('Failed to update password: ' + data.message);
      }
    } catch (error) {
      setStatus('Error updating password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-200">Settings</h1>
        <p className="text-zinc-400 mt-2">Manage your account and application preferences</p>
      </div>

      {status && (
        <Alert variant={status.includes('Error') || status.includes('Failed') ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card className="p-6 bg-black border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-200 mb-4">Profile Settings</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-400">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-200"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-400">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-200"
                  placeholder="Your email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
            <Button 
              type="submit"
              className="w-full bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Application Settings */}
        <Card className="p-6 bg-black border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-200 mb-4">Application Settings</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-zinc-400" />
                  <label className="text-sm font-medium text-zinc-200">
                    Push Notifications
                  </label>
                </div>
                <p className="text-xs text-zinc-400">
                  Receive notifications for new messages
                </p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-zinc-400" />
                  <label className="text-sm font-medium text-zinc-200">
                    Auto Reconnect
                  </label>
                </div>
                <p className="text-xs text-zinc-400">
                  Automatically reconnect when connection is lost
                </p>
              </div>
              <Switch
                checked={settings.autoReconnect}
                onCheckedChange={(checked) => handleSettingChange('autoReconnect', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-zinc-400" />
                  <label className="text-sm font-medium text-zinc-200">
                    Message Sound
                  </label>
                </div>
                <p className="text-xs text-zinc-400">
                  Play sound when sending messages
                </p>
              </div>
              <Switch
                checked={settings.messageSound}
                onCheckedChange={(checked) => handleSettingChange('messageSound', checked)}
              />
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="p-6 bg-black border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-200 mb-4">Security</h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-400">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  type="password"
                  className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-200"
                  placeholder="Enter current password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-400">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  type="password"
                  className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-200"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
            </div>
            <Button 
              type="submit"
              className="w-full bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}