'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { leaveAPI, attendanceAPI, payrollAPI, notificationAPI, authAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Bell,
  Users,
} from 'lucide-react';
import { format, startOfDay, isSameDay } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingLeaves: 0,
    todayAttendance: null as any,
    payrollThisMonth: 0,
    unreadNotifications: 0,
    totalEmployees: 0,
    approvedLeaves: 0,
    teamPresentToday: 0,
  });
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [teamTodayAttendance, setTeamTodayAttendance] = useState<any[]>([]);

  const isManager = user?.role === 'manager';
  const canViewAll = ['admin', 'hr_staff', 'manager'].includes(user?.role || '');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const today = startOfDay(now);

      const userId = user?._id || user?.id;

      const results = await Promise.allSettled([
        leaveAPI.getAll(),
        attendanceAPI.getRecords(),
        payrollAPI.getAll(),
        notificationAPI.getAll({ isRead: false }),
        isManager ? authAPI.getAllUsers() : Promise.resolve(null),
      ]);

      const leavesRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const attendanceRes = results[1].status === 'fulfilled' ? results[1].value : null;
      const payrollRes = results[2].status === 'fulfilled' ? results[2].value : null;
      const notificationsRes = results[3].status === 'fulfilled' ? results[3].value : null;
      const employeesRes = results[4].status === 'fulfilled' ? results[4].value : null;

      const leaves = leavesRes?.data?.data || [];
      const attendance = attendanceRes?.data?.data || [];
      const payrolls = payrollRes?.data?.data || [];
      const notifications = notificationsRes?.data?.data || [];
      const allUsers = employeesRes?.data?.data || [];

      // Log all users to see their roles
      console.log('All users from API:', allUsers.map((u: any) => ({
        name: u.name,
        role: u.role,
        id: u._id
      })));

      // Filter to get only employees (not managers, HR staff, or admins)
      const employees = allUsers.filter((emp: any) => emp.role === 'employee');

      console.log('Filtered employees only:', employees.map((e: any) => ({
        name: e.name,
        role: e.role,
        id: e._id
      })));

      const pendingLeaves = leaves.filter((l: any) => l.status === 'pending').length;
      const approvedLeaves = leaves.filter((l: any) => l.status === 'approved').length;
      
      let todayAttendance = null;
      for (const a of attendance) {
        try {
          if (!a.employeeId) continue;
          const attDate = startOfDay(new Date(a.date));
          const empId = typeof a.employeeId === 'object' ? (a.employeeId._id || a.employeeId.id) : a.employeeId;
          if (!empId) continue;
          const isToday = isSameDay(attDate, today);
          const isMyRecord = String(empId) === String(userId);
          if (isToday && isMyRecord) {
            todayAttendance = a;
            break;
          }
        } catch (err) {
          console.error('Error processing attendance record:', err);
        }
      }

      let teamAttendance: any[] = [];
      let teamPresentToday = 0;
      
      if (isManager && employees.length > 0) {
        // Get only employee IDs (excluding managers, HR staff, admins)
        const employeeIds = employees.map((emp: any) => String(emp._id || emp.id));
        
        console.log('Employee IDs (strings):', employeeIds);
        
        // Filter attendance to only show employees
        teamAttendance = attendance.filter((a: any) => {
          if (!a.employeeId) return false;
          try {
            const attDate = startOfDay(new Date(a.date));
            const empId = typeof a.employeeId === 'object' ? (a.employeeId._id || a.employeeId.id) : a.employeeId;
            const empIdStr = String(empId);
            const isToday = isSameDay(attDate, today);
            const isEmployee = employeeIds.includes(empIdStr);
            
            // Get employee role for debugging
            const empRole = typeof a.employeeId === 'object' ? a.employeeId.role : 'unknown';
            
            console.log('Attendance check:', {
              name: typeof a.employeeId === 'object' ? a.employeeId.name : empIdStr,
              role: empRole,
              empId: empIdStr,
              isToday,
              isEmployee,
              status: a.status,
              included: isToday && isEmployee
            });
            
            return isToday && isEmployee;
          } catch (err) {
            console.error('Error filtering attendance:', err);
            return false;
          }
        });

        teamPresentToday = teamAttendance.filter(a => a.status === 'present').length;
        
        console.log('Final team attendance:', {
          total: teamAttendance.length,
          present: teamPresentToday,
          totalEmployees: employees.length,
          records: teamAttendance.map(a => ({
            name: typeof a.employeeId === 'object' ? a.employeeId.name : 'unknown',
            role: typeof a.employeeId === 'object' ? a.employeeId.role : 'unknown',
            status: a.status
          }))
        });
      }

      let payrollThisMonth = 0;
      if (['admin', 'hr_staff'].includes(user?.role || '')) {
        payrollThisMonth = payrolls.reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0);
      } else {
        const myPayroll = payrolls.find((p: any) => {
          if (!p.employeeId) return false;
          const pEmpId = typeof p.employeeId === 'object' ? (p.employeeId._id || p.employeeId.id) : p.employeeId;
          return pEmpId && String(pEmpId) === String(userId);
        });
        payrollThisMonth = myPayroll?.netSalary || 0;
      }

      setStats({
        pendingLeaves,
        todayAttendance,
        payrollThisMonth,
        unreadNotifications: notifications.length,
        totalEmployees: employees.length,
        approvedLeaves,
        teamPresentToday,
      });

      setRecentLeaves(leaves.slice(0, 5));
      setRecentAttendance(attendance.filter((a: any) => a.employeeId).slice(0, 5));
      setTeamTodayAttendance(teamAttendance);

    } catch (error: any) {
      console.error('Dashboard fetch error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: 'default',
      approved: 'success',
      rejected: 'destructive',
      present: 'success',
      absent: 'destructive',
      late: 'warning',
      'half-day': 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getEmployeeName = (employeeId: any) => {
    if (!employeeId) return 'Unknown';
    if (typeof employeeId === 'string') return 'Employee';
    return employeeId.name || 'Unknown';
  };

  const getEmployeeRole = (employeeId: any) => {
    if (!employeeId || typeof employeeId === 'string') return '';
    return employeeId.role || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}! Here's your overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {canViewAll ? 'Pending Leave Requests' : 'My Pending Leaves'}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingLeaves}</div>
            <p className="text-xs text-muted-foreground">
              {stats.approvedLeaves} approved this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isManager ? 'Employees Present Today' : "Today's Attendance"}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isManager ? (
              <>
                <div className="text-2xl font-bold">
                  {stats.teamPresentToday}/{stats.totalEmployees}
                </div>
                <p className="text-xs text-muted-foreground">
                  Employees present
                </p>
              </>
            ) : stats.todayAttendance ? (
              <>
                <div className="text-2xl font-bold capitalize">
                  {stats.todayAttendance.status}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.todayAttendance.checkIn
                    ? `In: ${format(new Date(stats.todayAttendance.checkIn), 'hh:mm a')}`
                    : 'Not checked in'}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">No record today</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {['admin', 'hr_staff'].includes(user?.role || '') ? 'Total Payroll This Month' : 'My Payroll'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.payrollThisMonth.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadNotifications}</div>
            <p className="text-xs text-muted-foreground">Click bell icon to view</p>
          </CardContent>
        </Card>
      </div>

      {/* Manager's Team Attendance Today */}
      {isManager && teamTodayAttendance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee Attendance Today ({teamTodayAttendance.length} employees)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamTodayAttendance.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>
                      {getEmployeeName(record.employeeId)}
                      {/* Show role for debugging */}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({getEmployeeRole(record.employeeId)})
                      </span>
                    </TableCell>
                    <TableCell>
                      {record.checkIn
                        ? format(new Date(record.checkIn), 'hh:mm a')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {record.checkOut
                        ? format(new Date(record.checkOut), 'hh:mm a')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {record.workHours ? `${record.workHours.toFixed(2)} hrs` : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Manager: Show message if no employees checked in */}
      {isManager && teamTodayAttendance.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee Attendance Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No employees have checked in today
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Leave Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLeaves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No leave requests yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {canViewAll && <TableHead>Employee</TableHead>}
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeaves.map((leave) => (
                  <TableRow key={leave._id}>
                    {canViewAll && (
                      <TableCell>{getEmployeeName(leave.employeeId)}</TableCell>
                    )}
                    <TableCell className="capitalize">{leave.leaveType}</TableCell>
                    <TableCell>
                      {format(new Date(leave.startDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAttendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attendance records yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {canViewAll && <TableHead>Employee</TableHead>}
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAttendance.map((record) => (
                  <TableRow key={record._id}>
                    {canViewAll && (
                      <TableCell>{getEmployeeName(record.employeeId)}</TableCell>
                    )}
                    <TableCell>
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {record.checkIn
                        ? format(new Date(record.checkIn), 'hh:mm a')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {record.checkOut
                        ? format(new Date(record.checkOut), 'hh:mm a')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {record.workHours ? `${record.workHours.toFixed(2)} hrs` : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
