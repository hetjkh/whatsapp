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
  Smartphone,
  ChevronLeft,
  ChevronRight
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 rounded-md text-zinc-200 hover:bg-zinc-800 transition-colors"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-black border-r border-zinc-800 transition-all duration-300 ease-in-out",
          // Desktop behavior
          "hidden lg:flex lg:flex-col",
          isSidebarOpen ? "lg:w-64" : "lg:w-16",
          // Mobile behavior
          "lg:translate-x-0",
          isMobileMenuOpen ? "flex flex-col w-64 translate-x-0" : "lg:flex -translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo Section */}
          <div className={cn(
            "border-b border-zinc-800 transition-all duration-300 ease-in-out",
            isSidebarOpen ? "p-6" : "p-4"
          )}>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-zinc-200 flex-shrink-0" />
              <span className={cn(
                "text-lg font-semibold text-zinc-200 transition-all duration-300 ease-in-out",
                isSidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 lg:hidden"
              )}>
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
                <div key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md transition-all duration-300 ease-in-out relative",
                      "hover:bg-zinc-800/50",
                      isSidebarOpen ? "px-3 py-2" : "px-3 py-3 justify-center",
                      isActive ? "bg-zinc-800 text-zinc-200" : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className={cn(
                      "transition-all duration-300 ease-in-out whitespace-nowrap",
                      isSidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 lg:hidden"
                    )}>
                      {link.title}
                    </span>
                  </Link>
                  
                  {/* Tooltip for collapsed state */}
                  {!isSidebarOpen && (
                    <div className={cn(
                      "hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-zinc-800 text-zinc-200 text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50"
                    )}>
                      {link.title}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-zinc-800"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Toggle Button - Desktop Only */}
          <div className="hidden lg:block p-4 border-t border-zinc-800">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn(
                "flex items-center gap-3 w-full rounded-md transition-all duration-300 ease-in-out",
                "hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200",
                isSidebarOpen ? "px-3 py-2" : "px-3 py-3 justify-center"
              )}
            >
              {isSidebarOpen ? (
                <>
                  <ChevronLeft className="h-5 w-5 flex-shrink-0" />
                  <span className="transition-all duration-300 ease-in-out">
                    Collapse
                  </span>
                </>
              ) : (
                <ChevronRight className="h-5 w-5 flex-shrink-0" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 ease-in-out",
        // Desktop margins
        isSidebarOpen ? "lg:ml-64" : "lg:ml-16",
        // Mobile margins
        "ml-0",
        "p-8"
      )}>
        {children}
      </main>
    </div>
  );
}