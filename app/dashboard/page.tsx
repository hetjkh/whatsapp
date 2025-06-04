"use client";

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import {
  BarChart3,
  MessageSquare,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupStats {
  name: string;
  messages: number;
}

interface Analytics {
  totalMessages: number;
  successRate: number;
  activeGroups: number;
  messageGrowth: number;
  groupGrowth: number;
  recentActivity: Array<{
    type: 'message' | 'group' | 'connection';
    count?: number;
    time: string;
  }>;
  chatStats: {
    dailyMessages: any[];
    topGroups: GroupStats[];
    messageTypes: {
      text: number;
      media: number;
      documents: number;
    };
  };
}

export default function DashboardOverview() {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalMessages: 0,
    successRate: 0,
    activeGroups: 0,
    messageGrowth: 0,
    groupGrowth: 0,
    recentActivity: [],
    chatStats: {
      dailyMessages: [],
      topGroups: [],
      messageTypes: {
        text: 0,
        media: 0,
        documents: 0
      }
    }
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://bulkwhasapp-backend.onrender.com/api/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        if (data.status) {
          setAnalytics(data.data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };

    fetchAnalytics();
    // Refresh analytics every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-200">Dashboard Overview</h1>
        <p className="text-zinc-400 mt-2">Monitor your WhatsApp messaging activity and performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-black border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex items-center text-green-500">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              {analytics.messageGrowth}%
            </div>
          </div>
          <h3 className="text-zinc-400 text-sm">Total Messages</h3>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-bold text-zinc-200">{analytics.totalMessages}</span>
            <span className="text-zinc-500 text-sm mb-1">messages</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full mt-4">
            <div 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: '75%' }}
            />
          </div>
        </Card>

        <Card className="p-6 bg-black border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <h3 className="text-zinc-400 text-sm">Connect</h3>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-bold text-zinc-200">{analytics.successRate}%</span>
            <span className="text-zinc-500 text-sm mb-1">delivery rate</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full mt-4">
            <div 
              className="h-full bg-green-500 rounded-full" 
              style={{ width: `${analytics.successRate}%` }}
            />
          </div>
        </Card>

      </div>
    </div>
  );
}