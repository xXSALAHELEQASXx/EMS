'use client';

import { useEffect, useState } from 'react';
import { notificationAPI } from '@/lib/api';
import { Notification } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getAll();
      setNotifications(response.data.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      ));
      toast({
        title: 'Success',
        description: 'Notification marked as read',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(notifications.filter(n => n._id !== id));
      toast({
        title: 'Success',
        description: 'Notification deleted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: any = {
      leave: '📅',
      payroll: '💰',
      attendance: '⏰',
      general: '📢',
      system: '⚙️',
    };
    return icons[type] || '🔔';
  };

  const getNotificationColor = (type: string) => {
    const colors: any = {
      leave: 'bg-blue-50 border-blue-200',
      payroll: 'bg-green-50 border-green-200',
      attendance: 'bg-yellow-50 border-yellow-200',
      general: 'bg-purple-50 border-purple-200',
      system: 'bg-gray-50 border-gray-200',
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your latest activities
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Bell className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{unreadCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {notifications.length - unreadCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                You're all caught up! Check back later for updates.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    notification.isRead 
                      ? 'bg-white border-gray-200' 
                      : getNotificationColor(notification.type)
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                            {!notification.isRead && (
                              <Badge variant="destructive" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className={`text-sm ${
                            notification.isRead 
                              ? 'text-muted-foreground' 
                              : 'text-foreground font-medium'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(notification.createdAt), 'MMM dd, yyyy • hh:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(notification._id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(notification._id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
