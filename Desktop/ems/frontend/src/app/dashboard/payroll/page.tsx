'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { payrollAPI } from '@/lib/api';
import { PayrollRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Plus, CheckCircle, Pencil } from 'lucide-react';

export default function PayrollPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [editFormData, setEditFormData] = useState({
    bonuses: '',
    deductions: '',
  });

  const isHRStaff = user?.role === 'hr_staff';
  const isAdmin = user?.role === 'admin';
  const canManagePayroll = isHRStaff || isAdmin;
  const canViewAll = isHRStaff || isAdmin;

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const response = await payrollAPI.getAll();
      console.log('Fetched payrolls:', response.data.data);
      setPayrolls(response.data.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch payroll records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkGenerate = async () => {
    const now = new Date();
    try {
      const response = await payrollAPI.bulkGenerate({
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
      
      toast({
        title: 'Success',
        description: response.data.message || 'Payroll generated for all employees',
      });
      fetchPayrolls();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to generate payroll',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPaid = async (payrollId: string) => {
    try {
      await payrollAPI.update(payrollId, { status: 'paid' });
      toast({
        title: 'Success',
        description: 'Payroll marked as paid successfully',
      });
      fetchPayrolls();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update payroll status',
        variant: 'destructive',
      });
    }
  };

  const handleEditClick = (payroll: PayrollRecord) => {
    setSelectedPayroll(payroll);
    setEditFormData({
      bonuses: payroll.bonuses.toString(),
      deductions: payroll.deductions.toString(),
    });
    setOpenEditDialog(true);
  };

  const handleUpdatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPayroll) return;

    try {
      const updateData = {
        bonuses: parseFloat(editFormData.bonuses) || 0,
        deductions: parseFloat(editFormData.deductions) || 0,
      };

      await payrollAPI.update(selectedPayroll._id, updateData);
      
      toast({
        title: 'Success',
        description: 'Bonuses and deductions updated successfully',
      });
      
      setOpenEditDialog(false);
      setSelectedPayroll(null);
      setEditFormData({ bonuses: '', deductions: '' });
      fetchPayrolls();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update payroll',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: 'default',
      processed: 'secondary',
      paid: 'success',
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
          <p className="mt-4 text-muted-foreground">Loading payroll...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground">
            {canViewAll 
              ? 'View and manage employee payroll' 
              : 'View your payroll records'}
          </p>
        </div>
        {canManagePayroll && (
          <Button onClick={handleBulkGenerate}>
            <DollarSign className="mr-2 h-4 w-4" />
            Generate Monthly Payroll
          </Button>
        )}
      </div>

      {/* Payroll Stats */}
      {canViewAll && payrolls.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${payrolls.reduce((sum, p) => sum + p.netSalary, 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Records</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {payrolls.filter(p => p.status === 'paid').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Records</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {payrolls.filter(p => p.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bonuses</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${payrolls.reduce((sum, p) => sum + p.bonuses, 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {canViewAll ? 'All Payroll Records' : 'My Payroll Records'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payrolls.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payroll records</h3>
              <p className="text-muted-foreground mb-4">
                {canManagePayroll 
                  ? 'Generate payroll for this month to get started'
                  : 'No payroll records available yet'}
              </p>
              {canManagePayroll && (
                <Button onClick={handleBulkGenerate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Payroll
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {canViewAll && <TableHead>Employee</TableHead>}
                  <TableHead>Period</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Bonuses</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  {isHRStaff && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls.map((payroll) => (
                  <TableRow key={payroll._id}>
                    {canViewAll && (
                      <TableCell>
                        {getEmployeeName(payroll.employeeId)}
                      </TableCell>
                    )}
                    <TableCell>
                      {new Date(payroll.year, payroll.month - 1).toLocaleDateString(
                        'en-US',
                        { month: 'long', year: 'numeric' }
                      )}
                    </TableCell>
                    <TableCell>${payroll.baseSalary.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600">
                      +${payroll.bonuses.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-red-600">
                      -${payroll.deductions.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${payroll.netSalary.toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                    {isHRStaff && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(payroll)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {payroll.status !== 'paid' ? (
                            <Button
                              size="sm"
                              onClick={() => handleMarkAsPaid(payroll._id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark Paid
                            </Button>
                          ) : (
                            <Badge variant="success">Paid</Badge>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Bonuses/Deductions Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bonuses & Deductions</DialogTitle>
            <DialogDescription>
              Update bonus and deduction amounts for this payroll record
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePayroll} className="space-y-4">
            {selectedPayroll && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Employee:</span>{' '}
                  {getEmployeeName(selectedPayroll.employeeId)}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Period:</span>{' '}
                  {new Date(selectedPayroll.year, selectedPayroll.month - 1).toLocaleDateString(
                    'en-US',
                    { month: 'long', year: 'numeric' }
                  )}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Base Salary:</span>{' '}
                  ${selectedPayroll.baseSalary.toFixed(2)}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Current Net:</span>{' '}
                  <span className="font-semibold">
                    ${selectedPayroll.netSalary.toFixed(2)}
                  </span>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="bonuses">Bonuses ($)</Label>
              <Input
                id="bonuses"
                type="number"
                step="0.01"
                min="0"
                value={editFormData.bonuses}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, bonuses: e.target.value })
                }
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Additional amount to be added to the salary
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deductions">Deductions ($)</Label>
              <Input
                id="deductions"
                type="number"
                step="0.01"
                min="0"
                value={editFormData.deductions}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, deductions: e.target.value })
                }
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Amount to be deducted from the salary (taxes, insurance, etc.)
              </p>
            </div>

            {selectedPayroll && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-900 mb-1">
                  New Net Salary:
                </p>
                <p className="text-2xl font-bold text-green-700">
                  $
                  {(
                    selectedPayroll.baseSalary +
                    (parseFloat(editFormData.bonuses) || 0) -
                    (parseFloat(editFormData.deductions) || 0)
                  ).toFixed(2)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Base (${selectedPayroll.baseSalary.toFixed(2)}) + Bonuses ($
                  {(parseFloat(editFormData.bonuses) || 0).toFixed(2)}) - Deductions ($
                  {(parseFloat(editFormData.deductions) || 0).toFixed(2)})
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setOpenEditDialog(false);
                  setSelectedPayroll(null);
                  setEditFormData({ bonuses: '', deductions: '' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full">
                Update Payroll
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
