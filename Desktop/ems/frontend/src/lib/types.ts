// User Types
export interface User {
  _id: string;
  id?: string;
  email: string;
  name: string;
  role: 'employee' | 'manager' | 'hr_staff' | 'admin';
  department?: string;
  position?: string;
  managerId?: string;
  baseSalary?: number;
  isActive: boolean;
  createdAt: string;
}

// Leave Request Types
export interface LeaveRequest {
  _id: string;
  employeeId: User | string;
  leaveType: 'sick' | 'vacation' | 'personal' | 'emergency' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: User | string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Attendance Types
export interface AttendanceRecord {
  _id: string;
  employeeId: User | string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  workHours?: number;
  notes?: string;
  createdAt: string;
}

// Payroll Types
export interface PayrollRecord {
  _id: string;
  employeeId: User | string;
  month: number;
  year: number;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
  processedBy?: User | string;
  paidDate?: string;
  createdAt: string;
}

// Notification Types
export interface Notification {
  _id: string;
  userId: string;
  message: string;
  type: 'leave' | 'payroll' | 'attendance' | 'general' | 'system';
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  unreadCount?: number;
  error?: string;
}

// Auth Response
export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}
