'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  DollarSign,
  Building2,
  Bell,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['employee', 'manager', 'hr_staff', 'admin'],
  },
  {
    name: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
    roles: ['employee', 'manager', 'hr_staff', 'admin'],
  },
  {
    name: 'Leave Management',
    href: '/dashboard/leave',
    icon: Calendar,
    roles: ['employee', 'manager', 'hr_staff', 'admin'],
  },
  {
    name: 'Attendance',
    href: '/dashboard/attendance',
    icon: Clock,
    roles: ['employee', 'manager', 'hr_staff', 'admin'],
  },
  {
    name: 'Payroll',
    href: '/dashboard/payroll',
    icon: DollarSign,
    roles: ['employee', 'manager', 'hr_staff', 'admin'],
  },
  {
    name: 'Employees',
    href: '/dashboard/employees',
    icon: Users,
    roles: ['manager', 'hr_staff', 'admin'],
  },
  {
    name: 'Departments',
    href: '/dashboard/departments',
    icon: Building2,
    roles: ['hr_staff', 'admin'],
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <nav className="w-64 bg-card border-r min-h-screen p-4">
      <div className="mb-8">
        <div className="flex items-center gap-2 px-2">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">EMS</h2>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
