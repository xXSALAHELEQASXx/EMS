'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { departmentAPI, authAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Building2, Users, Plus, Pencil, Trash2 } from 'lucide-react';
import ProtectedRoute from '@/components/protected-route';

interface Department {
  id: string;
  name: string;
  description: string;
  employeeCount?: number;
  managerId?: string;
  manager?: string;
}

function DepartmentsPageContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deptResponse, empResponse] = await Promise.all([
        departmentAPI.getAll(),
        authAPI.getAllUsers(),
      ]);

      const depts = deptResponse.data.data || [];
      const emps = empResponse.data.data || [];
      
      setEmployees(emps);

      // Calculate employee count per department
      const deptsWithCount = depts.map((dept: Department) => ({
        ...dept,
        employeeCount: emps.filter((emp: any) => emp.department === dept.name).length,
      }));

      setDepartments(deptsWithCount);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await departmentAPI.create(formData);
      
      toast({
        title: 'Success',
        description: 'Department created successfully',
      });
      
      setOpenDialog(false);
      setFormData({ name: '', description: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create department',
        variant: 'destructive',
      });
    }
  };

  const handleEditClick = (dept: Department) => {
    setSelectedDepartment(dept);
    setFormData({
      name: dept.name,
      description: dept.description,
    });
    setOpenEditDialog(true);
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDepartment) return;

    try {
      await departmentAPI.update(selectedDepartment.id, formData);
      
      toast({
        title: 'Success',
        description: 'Department updated successfully',
      });
      
      setOpenEditDialog(false);
      setSelectedDepartment(null);
      setFormData({ name: '', description: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update department',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (dept: Department) => {
    setSelectedDepartment(dept);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDepartment) return;

    try {
      await departmentAPI.delete(selectedDepartment.id);
      
      toast({
        title: 'Success',
        description: 'Department deleted successfully',
      });
      
      setDeleteDialogOpen(false);
      setSelectedDepartment(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete department',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Department Management</h1>
          <p className="text-muted-foreground">
            Manage organizational departments
          </p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
              <DialogDescription>
                Add a new department to your organization
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Engineering, Sales, HR"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the department..."
                  rows={4}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Create Department
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Department Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Departments
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.reduce((sum, dept) => sum + (dept.employeeCount || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Employees/Dept
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.length > 0
                ? Math.round(
                    departments.reduce((sum, dept) => sum + (dept.employeeCount || 0), 0) /
                      departments.length
                  )
                : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Departments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Departments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No departments found
                  </TableCell>
                </TableRow>
              ) : (
                departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{dept.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm text-muted-foreground truncate">
                        {dept.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{dept.employeeCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditClick(dept)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteClick(dept)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update department information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateDepartment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Department Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Engineering, Sales, HR"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the department..."
                rows={4}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setOpenEditDialog(false);
                  setFormData({ name: '', description: '' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full">
                Update Department
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
              This will permanently delete the department "{selectedDepartment?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDepartment(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function DepartmentsPage() {
  return (
    <ProtectedRoute allowedRoles={['hr_staff', 'admin']}>
      <DepartmentsPageContent />
    </ProtectedRoute>
  );
}
