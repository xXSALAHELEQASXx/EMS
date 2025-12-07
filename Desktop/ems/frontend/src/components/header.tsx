'use client';

import { UserNav } from './user-nav';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useEffect, useState } from 'react';
import { notificationAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export function Header() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Poll every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getAll({ isRead: false });
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleNotificationClick = () => {
    router.push('/dashboard/notifications');
  };

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">EMS Dashboard</h2>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={handleNotificationClick}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
          <UserNav />
        </div>
      </div>
    </header>
  );
}
