"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  MessageSquare,
  Users,
  Settings,
  Menu,
  X,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarLinks = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: BarChart3
  },
  {
    title: 'Connection',
    href: '/dashboard/connection',
    icon: Smartphone
  },
  {
    title: 'Messaging',
    href: '/dashboard/messaging',
    icon: MessageSquare
  },
  {
    title: 'Templates',
    href: '/dashboard/templates',
    icon: Users
  }
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();



  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 rounded-md text-zinc-200"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transition-transform bg-black border-r border-zinc-800",
          "w-64 lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-zinc-200" />
              <span className="text-lg font-semibold text-zinc-200">
                Dashboard
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    "hover:bg-zinc-800/50",
                    isActive ? "bg-zinc-800 text-zinc-200" : "text-zinc-400"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.title}</span>
                </Link>
              );
            })}
          </nav>

         
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300",
        isSidebarOpen ? "lg:ml-64" : "lg:ml-0",
        "p-8"
      )}>
        {children}
      </main>
    </div>
  );
}