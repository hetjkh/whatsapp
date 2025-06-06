
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  MessageSquare,
  CheckCircle2,
  Phone,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Send,
  FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as XLSX from "xlsx";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

interface TemplateStats {
  _id: string;
  name: string;
  messagesSent: number;
  successRate: number;
}

interface Analytics {
  totalMessages: number;
  successRate: number;
  messageGrowth: number;
  totalInstances: number;
  connectedInstances: number;
  disconnectedInstances: number;
  totalTemplates: number;
  recentActivity: Array<{
    type: "message" | "template" | "connection";
    count?: number;
    time: string;
  }>;
  chatStats: {
    dailyMessages: Array<{ date: string; count: number }>;
    messageTypes: {
      text: number;
      media: number;
      documents: number;
    };
  };
  topTemplates: TemplateStats[];
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalMessages: 0,
    successRate: 0,
    messageGrowth: 0,
    totalInstances: 0,
    connectedInstances: 0,
    disconnectedInstances: 0,
    totalTemplates: 0,
    recentActivity: [],
    chatStats: {
      dailyMessages: [],
      messageTypes: {
        text: 0,
        media: 0,
        documents: 0,
      },
    },
    topTemplates: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");
  const router = useRouter();

  // Dummy data for demonstration (replace with API data)
  const dummyAnalytics: Analytics = {
    totalMessages: 12500,
    successRate: 98.5,
    messageGrowth: 12.3,
    totalInstances: 10,
    connectedInstances: 8,
    disconnectedInstances: 2,
    totalTemplates: 15,
    recentActivity: [
      { type: "message", count: 150, time: "2025-06-06 15:30" },
      { type: "template", count: 1, time: "2025-06-06 14:00" },
      { type: "connection", time: "2025-06-06 13:45" },
      { type: "message", count: 300, time: "2025-06-06 12:15" },
    ],
    chatStats: {
      dailyMessages: [
        { date: "2025-06-01", count: 800 },
        { date: "2025-06-02", count: 950 },
        { date: "2025-06-03", count: 1100 },
        { date: "2025-06-04", count: 900 },
        { date: "2025-06-05", count: 1200 },
        { date: "2025-06-06", count: 1400 },
      ],
      messageTypes: {
        text: 9000,
        media: 3000,
        documents: 500,
      },
    },
    topTemplates: [
      { _id: "1", name: "Welcome Message", messagesSent: 3000, successRate: 99.2 },
      { _id: "2", name: "Promo Offer", messagesSent: 2500, successRate: 97.8 },
      { _id: "3", name: "Follow-Up", messagesSent: 2000, successRate: 98.5 },
    ],
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      const token = Cookies.get("token");
      if (!token) {
        router.push("/login");
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`https://bulkwhasapp-backend.onrender.com/api/analytics?timeRange=${timeRange}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (data.status) {
          setAnalytics(data.data);
        } else {
          setAnalytics(dummyAnalytics);
          toast.error(data.message || "Failed to fetch analytics, using sample data");
        }
      } catch (error) {
        setAnalytics(dummyAnalytics);
        toast.error("Error fetching analytics, using sample data");
        console.error("Error fetching analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [router, timeRange]);

  // Line chart data for daily messages
  const lineChartData = {
    labels: analytics.chatStats.dailyMessages.map((entry) => entry.date),
    datasets: [
      {
        label: "Messages Sent",
        data: analytics.chatStats.dailyMessages.map((entry) => entry.count),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Daily Message Volume" },
    },
    scales: {
      x: { title: { display: true, text: "Date" } },
      y: { title: { display: true, text: "Messages" }, beginAtZero: true },
    },
  };

  // Pie chart data for message types
  const pieChartData = {
    labels: ["Text", "Media", "Documents"],
    datasets: [
      {
        data: [
          analytics.chatStats.messageTypes.text,
          analytics.chatStats.messageTypes.media,
          analytics.chatStats.messageTypes.documents,
        ],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"],
        borderColor: ["#1e40af", "#047857", "#b45309"],
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Message Type Distribution" },
    },
  };

  // Export analytics data as CSV
  const exportAnalytics = () => {
    const data = [
      ["Metric", "Value"],
      ["Total Messages", analytics.totalMessages],
      ["Success Rate (%)", analytics.successRate],
      ["Message Growth (%)", analytics.messageGrowth],
      ["Total Instances", analytics.totalInstances],
      ["Connected Instances", analytics.connectedInstances],
      ["Disconnected Instances", analytics.disconnectedInstances],
      ["Total Templates", analytics.totalTemplates],
      ["", ""],
      ["Top Templates", ""],
      ["Name", "Messages Sent", "Success Rate (%)"],
      ...analytics.topTemplates.map((t) => [t.name, t.messagesSent, t.successRate]),
      ["", ""],
      ["Message Types", ""],
      ["Text", analytics.chatStats.messageTypes.text],
      ["Media", analytics.chatStats.messageTypes.media],
      ["Documents", analytics.chatStats.messageTypes.documents],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analytics");
    XLSX.write(wb, `analytics_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto bg-zinc-950 min-h-screen">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#18181b",
            color: "#fff",
            borderRadius: "8px",
          },
        }}
      />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-200">Dashboard Overview</h1>
          <p className="text-zinc-400 mt-2">Monitor your WhatsApp messaging activity and performance</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200 w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-200">
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={exportAnalytics}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
          >
            <FileDown className="h-5 w-5 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-zinc-400">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 bg-black border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-blue-500" />
                </div>
                <div className={cn("flex items-center", analytics.messageGrowth >= 0 ? "text-green-500" : "text-red-500")}>
                  {analytics.messageGrowth >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                  {Math.abs(analytics.messageGrowth)}%
                </div>
              </div>
              <h3 className="text-zinc-400 text-sm">Total Messages</h3>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-3xl font-bold text-zinc-200">{analytics.totalMessages.toLocaleString()}</span>
                <span className="text-zinc-500 text-sm mb-1">messages</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full mt-4">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "75%" }} />
              </div>
            </Card>

            <Card className="p-6 bg-black border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <h3 className="text-zinc-400 text-sm">Success Rate</h3>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-3xl font-bold text-zinc-200">{analytics.successRate}%</span>
                <span className="text-zinc-500 text-sm mb-1">delivery</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full mt-4">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${analytics.successRate}%` }} />
              </div>
            </Card>

            <Card className="p-6 bg-black border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Phone className="h-6 w-6 text-emerald-500" />
                </div>
                <Button variant="link" className="text-zinc-400 hover:text-zinc-200" asChild>
                  <Link href="/devices">Manage</Link>
                </Button>
              </div>
              <h3 className="text-zinc-400 text-sm">Total Instances</h3>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-3xl font-bold text-zinc-200">{analytics.totalInstances}</span>
                <span className="text-zinc-500 text-sm mb-1">instances</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full mt-4">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(analytics.connectedInstances / analytics.totalInstances) * 100}%` }}
                />
              </div>
            </Card>

            <Card className="p-6 bg-black border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-purple-500" />
                </div>
                <Button variant="link" className="text-zinc-400 hover:text-zinc-200" asChild>
                  <Link href="/templates">Manage</Link>
                </Button>
              </div>
              <h3 className="text-zinc-400 text-sm">Total Templates</h3>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-3xl font-bold text-zinc-200">{analytics.totalTemplates}</span>
                <span className="text-zinc-500 text-sm mb-1">templates</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full mt-4">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: "80%" }} />
              </div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Message Trend Chart */}
              <Card className="bg-black border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-200 text-lg">Message Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <Line data={lineChartData} options={lineChartOptions} />
                  </div>
                </CardContent>
              </Card>

              {/* Message Type Distribution */}
              <Card className="bg-black border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-200 text-lg">Message Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <Pie data={pieChartData} options={pieChartOptions} />
                  </div>
                </CardContent>
              </Card>

              {/* Top Templates */}
              <Card className="bg-black border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-zinc-200 text-lg">Top Performing Templates</CardTitle>
                  <Button variant="link" className="text-zinc-400 hover:text-zinc-200" asChild>
                    <Link href="/templates">View All</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800">
                        <TableHead className="text-zinc-400">Template Name</TableHead>
                        <TableHead className="text-zinc-400">Messages Sent</TableHead>
                        <TableHead className="text-zinc-400">Success Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.topTemplates.slice(0, 5).map((template) => (
                        <TableRow key={template._id} className="border-zinc-800">
                          <TableCell className="text-zinc-200">{template.name}</TableCell>
                          <TableCell className="text-zinc-200">{template.messagesSent.toLocaleString()}</TableCell>
                          <TableCell className="text-zinc-200">{template.successRate}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Recent Activity */}
              <Card className="bg-black border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-200 text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {analytics.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-700/20 rounded-full">
                          {activity.type === "message" && <MessageSquare className="h-4 w-4 text-blue-500" />}
                          {activity.type === "template" && <MessageSquare className="h-4 w-4 text-purple-500" />}
                          {activity.type === "connection" && <Phone className="h-4 w-4 text-green-500" />}
                        </div>
                        <div>
                          <p className="text-zinc-200 text-sm">
                            {activity.type === "message" && `Sent ${activity.count} message(s)`}
                            {activity.type === "template" && `Created template`}
                            {activity.type === "connection" && `Device connected`}
                          </p>
                          <p className="text-zinc-400 text-xs">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-black border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-200 text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <Button
                      asChild
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 justify-start"
                    >
                      <Link href="/templates">
                        <Plus className="h-5 w-5 mr-2" />
                        Create Template
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 justify-start"
                    >
                      <Link href="/messages">
                        <Send className="h-5 w-5 mr-2" />
                        Send Message
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 justify-start"
                    >
                      <Link href="/devices">
                        <Phone className="h-5 w-5 mr-2" />
                        Add Device
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Alerts */}
          {(analytics.disconnectedInstances > 0 || analytics.successRate < 100) && (
            <Card className="bg-black border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-200 text-lg">Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.disconnectedInstances > 0 && (
                    <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                      <p className="text-red-400">{analytics.disconnectedInstances} instance(s) disconnected</p>
                      <Button asChild variant="link" className="text-red-400">
                        <Link href="/devices">Resolve Now</Link>
                      </Button>
                    </div>
                  )}
                  {analytics.successRate < 100 && (
                    <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
                      <p className="text-yellow-400">
                        {(analytics.totalMessages * (1 - analytics.successRate / 100)).toFixed(0)} message(s) failed
                      </p>
                      <Button asChild variant="link" className="text-yellow-400">
                        <Link href="/messages">View Details</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
