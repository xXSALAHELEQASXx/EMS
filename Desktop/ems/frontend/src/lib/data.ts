import type { Employee, Department, LeaveRequest, Attendance, Payroll } from '@/lib/types';

export const departments: Department[] = [
  { id: 'd1', name: 'Engineering' },
  { id: 'd2', name: 'Human Resources' },
  { id: 'd3', name: 'Design' },
  { id: 'd4', name: 'Marketing' },
  { id: 'd5', name: 'Sales' },
];

export const employees: Employee[] = [
  { id: 'e1', name: 'Alice Johnson', email: 'alice@example.com', avatar: '1', departmentId: 'd1', managerId: null, role: 'Admin' },
  { id: 'e2', name: 'Bob Williams', email: 'bob@example.com', avatar: '2', departmentId: 'd1', managerId: 'e1', role: 'Manager' },
  { id: 'e3', name: 'Charlie Brown', email: 'charlie@example.com', avatar: '3', departmentId: 'd1', managerId: 'e2', role: 'Employee' },
  { id: 'e4', name: 'Diana Miller', email: 'diana@example.com', avatar: '4', departmentId: 'd2', managerId: 'e1', role: 'Manager' },
  { id: 'e5', name: 'Eve Davis', email: 'eve@example.com', avatar: '5', departmentId: 'd2', managerId: 'e4', role: 'Employee' },
  { id: 'e6', name: 'Frank White', email: 'frank@example.com', avatar: '6', departmentId: 'd3', managerId: 'e1', role: 'Manager' },
  { id: 'e7', name: 'Grace Lee', email: 'grace@example.com', avatar: '7', departmentId: 'd3', managerId: 'e6', role: 'Employee' },
  { id: 'e8', name: 'Henry Wilson', email: 'henry@example.com', avatar: '8', departmentId: 'd4', managerId: 'e1', role: 'Manager' },
  { id: 'e9', name: 'Ivy Garcia', email: 'ivy@example.com', avatar: '9', departmentId: 'd5', managerId: 'e1', role: 'Manager' },
  { id: 'e10', name: 'Jack Robinson', email: 'jack@example.com', avatar: '10', departmentId: 'd2', managerId: 'e4', role: 'HR Staff' },
];

export const leaveRequests: LeaveRequest[] = [
  { id: 'l1', employeeId: 'e3', managerId: 'e2', startDate: new Date('2024-08-01'), endDate: new Date('2024-08-05'), reason: 'Vacation', status: 'Approved' },
  { id: 'l2', employeeId: 'e5', managerId: 'e4', startDate: new Date('2024-08-10'), endDate: new Date('2024-08-12'), reason: 'Family event', status: 'Pending' },
  { id: 'l3', employeeId: 'e7', managerId: 'e6', startDate: new Date('2024-07-25'), endDate: new Date('2024-07-26'), reason: 'Sick leave', status: 'Rejected' },
  { id: 'l4', employeeId: 'e3', managerId: 'e2', startDate: new Date('2024-09-01'), endDate: new Date('2024-09-03'), reason: 'Personal', status: 'Pending' },
];

export const attendanceRecords: Attendance[] = [
  { id: 'a1', employeeId: 'e3', date: new Date('2024-07-22'), status: 'Present' },
  { id: 'a2', employeeId: 'e3', date: new Date('2024-07-23'), status: 'Present' },
  { id: 'a3', employeeId: 'e3', date: new Date('2024-07-24'), status: 'Absent' },
  { id: 'a4', employeeId: 'e5', date: new Date('2024-07-22'), status: 'Present' },
  { id: 'a5', employeeId: 'e5', date: new Date('2024-07-23'), status: 'On Leave' },
];

export const payrollRecords: Payroll[] = [
    { id: 'p1', employeeId: 'e3', payPeriod: '2024-07', grossSalary: 5000, deductions: 1000, netSalary: 4000},
    { id: 'p2', employeeId: 'e5', payPeriod: '2024-07', grossSalary: 5500, deductions: 1200, netSalary: 4300},
];

export const getDepartmentName = (id: string) => departments.find(d => d.id === id)?.name || 'N/A';
export const getEmployeeName = (id: string | null) => id ? employees.find(e => e.id === id)?.name || 'N/A' : 'N/A';
