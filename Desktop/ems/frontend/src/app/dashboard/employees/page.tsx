'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { User } from '@/lib/types';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users as UsersIcon, UserPlus, Pencil, Trash2 } from 'lucide-react';

export default function EmployeesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    department: '',
    position: '',
    baseSalary: '',
    isActive: true,
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const canViewAll = ['admin', 'hr_staff', 'manager'].includes(user?.role || '');
      
      if (canViewAll) {
        const response = await authAPI.getAllUsers();
        setEmployees(response.data.data || []);
      } else {
        if (user) {
          setEmployees([user]);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch employees',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (employee: User) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department || '',
      position: employee.position || '',
      baseSalary: employee.baseSalary?.toString() || '',
      isActive: employee.isActive,
    });
    setOpenEditDialog(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee) return;

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        position: formData.position,
        baseSalary: formData.baseSalary ? parseFloat(formData.baseSalary) : undefined,
        isActive: formData.isActive,
      };

      await authAPI.updateUser(selectedEmployee._id || selectedEmployee.id || '', updateData);
      
      toast({
        title: 'Success',
        description: 'Employee updated successfully',
      });
      
      setOpenEditDialog(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update employee',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (employee: User) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEmployee) return;

    try {
      await authAPI.deleteUser(selectedEmployee._id || selectedEmployee.id || '');
      
      toast({
        title: 'Success',
        description: 'Employee deleted successfully',
      });
      
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete employee',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: any = {
      admin: 'destructive',
      manager: 'default',
      hr_staff: 'secondary',
      employee: 'outline',
    };
    return <Badge variant={variants[role] || 'default'}>{role.replace('_', ' ')}</Badge>;
  };

  const canViewAll = ['admin', 'hr_staff', 'manager'].includes(user?.role || '');
  const canEdit = ['admin', 'hr_staff'].includes(user?.role || '');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <p className="text-muted-foreground">
            {canViewAll 
              ? 'View and manage employee information' 
              : 'View your profile information'}
          </p>
        </div>
      </div>

      {/* Stats Card */}
      {canViewAll && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Managers</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employees.filter(e => e.role === 'manager').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">HR Staff</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employees.filter(e => e.role === 'hr_staff').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employees.filter(e => e.isActive).length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>{canViewAll ? 'All Employees' : 'My Profile'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 7 : 6} className="text-center">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee._id || employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {employee.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{employee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.department || '-'}</TableCell>
                    <TableCell>{employee.position || '-'}</TableCell>
                    <TableCell>{getRoleBadge(employee.role)}</TableCell>
                    <TableCell>
                      <Badge variant={employee.isActive ? 'success' : 'secondary'}>
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditClick(employee)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {(employee._id || employee.id) !== (user?._id || user?.id) && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteClick(employee)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateEmployee} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="hr_staff">HR Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Input
                  id="edit-department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-position">Position</Label>
                <Input
                  id="edit-position"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-salary">Base Salary</Label>
                <Input
                  id="edit-salary"
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) =>
                    setFormData({ ...formData, baseSalary: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.isActive ? 'active' : 'inactive'}
                onValueChange={(value) =>
                  setFormData({ ...formData, isActive: value === 'active' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setOpenEditDialog(false);
                  setSelectedEmployee(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full">
                Update Employee
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the employee account for "{selectedEmployee?.name}".
              This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedEmployee(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
