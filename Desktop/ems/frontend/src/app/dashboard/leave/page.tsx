'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { leaveAPI } from '@/lib/api';
import { LeaveRequest } from '@/lib/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Calendar, Plus } from 'lucide-react';

export default function LeavePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'vacation',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Managers, HR Staff, and Admins can approve/reject
  const canApprove = ['manager', 'hr_staff', 'admin'].includes(user?.role || '');

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await leaveAPI.getAll();
      setLeaves(response.data.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch leave requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await leaveAPI.create(formData);
      toast({
        title: 'Success',
        description: 'Leave request submitted successfully',
      });
      setOpenDialog(false);
      setFormData({
        leaveType: 'vacation',
        startDate: '',
        endDate: '',
        reason: '',
      });
      fetchLeaves();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create leave request',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await leaveAPI.approve(id, 'approved');
      toast({
        title: 'Success',
        description: 'Leave request approved',
      });
      fetchLeaves();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;

    try {
      await leaveAPI.approve(id, 'rejected', reason);
      toast({
        title: 'Success',
        description: 'Leave request rejected',
      });
      fetchLeaves();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: 'default',
      approved: 'success',
      rejected: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getEmployeeName = (employeeId: any) => {
    if (!employeeId) return 'Unknown';
    if (typeof employeeId === 'string') return 'Employee';
    return employeeId.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">Request and manage leave</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Leave</DialogTitle>
              <DialogDescription>Submit a new leave request</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateLeave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leaveType">Leave Type</Label>
                <Select
                  value={formData.leaveType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, leaveType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Reason for leave..."
                  required
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">
                Submit Request
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {canApprove && <TableHead>Employee</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                {canApprove && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canApprove ? 7 : 5} className="text-center">
                    No leave requests
                  </TableCell>
                </TableRow>
              ) : (
                leaves.map((leave) => (
                  <TableRow key={leave._id}>
                    {canApprove && (
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
                    <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                    {canApprove && (
                      <TableCell>
                        {leave.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(leave._id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(leave._id)}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {leave.status}
                          </span>
                        )}
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
