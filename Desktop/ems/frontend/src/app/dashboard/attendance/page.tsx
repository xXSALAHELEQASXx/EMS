'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { attendanceAPI, authAPI } from '@/lib/api';
import { AttendanceRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Clock, LogIn, LogOut, Plus, UserCheck } from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    checkIn: '',
    checkOut: '',
    notes: '',
  });

  const isHRStaff = ['hr_staff', 'admin'].includes(user?.role || '');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [attendanceResponse, employeesResponse] = await Promise.all([
        attendanceAPI.getRecords(),
        isHRStaff ? authAPI.getAllUsers() : Promise.resolve({ data: { data: [] } }),
      ]);

      const data = attendanceResponse.data.data || [];
      setRecords(data);

      if (isHRStaff) {
        setEmployees(employeesResponse.data.data || []);
      }

      // Find today's record for current user
      const today = new Date().toISOString().split('T')[0];
      const todayRec = data.find((r: AttendanceRecord) =>
        r.date.startsWith(today) &&
        (typeof r.employeeId === 'object' ? r.employeeId._id : r.employeeId) === user?._id
      );
      setTodayRecord(todayRec || null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch attendance records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await attendanceAPI.checkIn();
      toast({
        title: 'Success',
        description: 'Checked in successfully',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to check in',
        variant: 'destructive',
      });
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceAPI.checkOut();
      toast({
        title: 'Success',
        description: 'Checked out successfully',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to check out',
        variant: 'destructive',
      });
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const recordData: any = {
        employeeId: formData.employeeId,
        date: formData.date,
        status: formData.status,
        notes: formData.notes || undefined,
      };

      // Only add times if provided
      if (formData.checkIn) {
        recordData.checkIn = `${formData.date}T${formData.checkIn}:00`;
      }
      if (formData.checkOut) {
        recordData.checkOut = `${formData.date}T${formData.checkOut}:00`;
      }

      await attendanceAPI.createRecord(recordData);

      toast({
        title: 'Success',
        description: 'Attendance record created successfully',
      });

      setOpenDialog(false);
      setFormData({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        checkIn: '',
        checkOut: '',
        notes: '',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create record',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      present: 'success',
      absent: 'destructive',
      late: 'warning',
      'half-day': 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getEmployeeName = (employeeId: any) => {
    if (!employeeId) return 'Unknown';
    if (typeof employeeId === 'string') {
      const emp = employees.find(e => e._id === employeeId || e.id === employeeId);
      return emp ? emp.name : 'Unknown';
    }
    return employeeId.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">Track your attendance and work hours</p>
        </div>
        {isHRStaff && (
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Generate Attendance Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Attendance Record</DialogTitle>
                <DialogDescription>
                  Create or update attendance record for an employee
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRecord} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Employee *</Label>
                  <Select
                    value={formData.employeeId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, employeeId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp._id || emp.id} value={emp._id || emp.id}>
                          {emp.name} - {emp.department || 'No Dept'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="half-day">Half Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.status !== 'absent' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="checkIn">Check In Time</Label>
                        <Input
                          id="checkIn"
                          type="time"
                          value={formData.checkIn}
                          onChange={(e) =>
                            setFormData({ ...formData, checkIn: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="checkOut">Check Out Time</Label>
                        <Input
                          id="checkOut"
                          type="time"
                          value={formData.checkOut}
                          onChange={(e) =>
                            setFormData({ ...formData, checkOut: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Add any notes about this attendance..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Generate Record
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Check In/Out Card - For Employees */}
      {!isHRStaff && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                {todayRecord ? (
                  <>
                    <div className="flex items-center gap-2">
                      <LogIn className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        Check In:{' '}
                        {todayRecord.checkIn
                          ? format(new Date(todayRecord.checkIn), 'hh:mm a')
                          : 'Not checked in'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <LogOut className="h-4 w-4 text-red-600" />
                      <span className="text-sm">
                        Check Out:{' '}
                        {todayRecord.checkOut
                          ? format(new Date(todayRecord.checkOut), 'hh:mm a')
                          : 'Not checked out'}
                      </span>
                    </div>
                    {todayRecord.workHours && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          Work Hours: {todayRecord.workHours.toFixed(2)} hrs
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">No attendance record for today</p>
                )}
              </div>
              <div className="flex gap-2">
                {!todayRecord && (
                  <Button onClick={handleCheckIn}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Check In
                  </Button>
                )}
                {todayRecord && !todayRecord.checkOut && (
                  <Button onClick={handleCheckOut} variant="destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Check Out
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Stats - For HR Staff */}
      {isHRStaff && records.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{records.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {records.filter(r => r.status === 'present').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <Clock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {records.filter(r => r.status === 'absent').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {records.filter(r => r.status === 'late').length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Work Hours</TableHead>
                <TableHead>Status</TableHead>
                {user?.role !== 'employee' && <TableHead>Employee</TableHead>}
                {isHRStaff && <TableHead>Notes</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isHRStaff ? 7 : (user?.role !== 'employee' ? 6 : 5)}
                    className="text-center"
                  >
                    No attendance records found
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record._id}>
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
                    {user?.role !== 'employee' && (
                      <TableCell>
                        {getEmployeeName(record.employeeId)}
                      </TableCell>
                    )}
                    {isHRStaff && (
                      <TableCell className="max-w-xs truncate">
                        {record.notes || '-'}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
