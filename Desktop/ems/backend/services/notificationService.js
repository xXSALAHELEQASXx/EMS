const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  // Notify manager about new leave request
  static async notifyLeaveRequest(leaveRequest) {
    try {
      const employee = await User.findById(leaveRequest.employeeId);
      
      if (employee.managerId) {
        await Notification.create({
          userId: employee.managerId,
          message: `${employee.name} has submitted a new leave request from ${leaveRequest.startDate.toLocaleDateString()} to ${leaveRequest.endDate.toLocaleDateString()}`,
          type: 'leave',
          relatedId: leaveRequest._id
        });
      }

      // Also notify HR staff and admin
      const hrAndAdmins = await User.find({ 
        role: { $in: ['hr_staff', 'admin'] },
        isActive: true
      });

      for (const user of hrAndAdmins) {
        await Notification.create({
          userId: user._id,
          message: `${employee.name} has submitted a new leave request`,
          type: 'leave',
          relatedId: leaveRequest._id
        });
      }
    } catch (error) {
      console.error('Error sending leave request notification:', error);
    }
  }

  // Notify employee about leave status
  static async notifyLeaveStatus(leaveRequest) {
    try {
      const statusMessage = leaveRequest.status === 'approved' 
        ? 'approved' 
        : `rejected${leaveRequest.rejectionReason ? ': ' + leaveRequest.rejectionReason : ''}`;

      await Notification.create({
        userId: leaveRequest.employeeId,
        message: `Your leave request has been ${statusMessage}`,
        type: 'leave',
        relatedId: leaveRequest._id
      });
    } catch (error) {
      console.error('Error sending leave status notification:', error);
    }
  }

  // Notify employee about payroll
  static async notifyPayroll(payrollRecord) {
    try {
      await Notification.create({
        userId: payrollRecord.employeeId,
        message: `Your payroll for ${new Date(payrollRecord.year, payrollRecord.month - 1).toLocaleDateString('en', { month: 'long', year: 'numeric' })} has been processed. Net salary: $${payrollRecord.netSalary}`,
        type: 'payroll',
        relatedId: payrollRecord._id
      });
    } catch (error) {
      console.error('Error sending payroll notification:', error);
    }
  }

  // Notify about attendance issues
  static async notifyAttendance(attendanceRecord, message) {
    try {
      await Notification.create({
        userId: attendanceRecord.employeeId,
        message: message,
        type: 'attendance',
        relatedId: attendanceRecord._id
      });
    } catch (error) {
      console.error('Error sending attendance notification:', error);
    }
  }
}

module.exports = NotificationService;
