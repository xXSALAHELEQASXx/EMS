'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardNav } from '@/components/dashboard-nav';
import { Header } from '@/components/header';
import ProtectedRoute from '@/components/protected-route';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <DashboardNav />
          <div className="flex-1">
            <Header />
            <main className="p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
