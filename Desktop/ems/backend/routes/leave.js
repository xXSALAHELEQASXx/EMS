const express = require('express');
const Leave = require('../models/LeaveRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Create leave request
router.post('/', authenticate, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    
    const leave = new Leave({
      employeeId: req.userId,
      leaveType,
      startDate,
      endDate,
      reason,
    });
    
    await leave.save();
    
    // Create notifications for HR staff and admin
    const adminsAndHR = await User.find({ 
      role: { $in: ['admin', 'hr_staff', 'manager'] },
      isActive: true 
    });
    
    const notifications = adminsAndHR.map(user => ({
      userId: user._id,
      type: 'leave',
      message: `New leave request from ${req.user.name} for ${leaveType}`,
    }));
    
    await Notification.insertMany(notifications);
    
    res.status(201).json({ 
      success: true,
      message: 'Leave request created successfully',
      data: leave 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to create leave request', 
      error: error.message 
    });
  }
});

// Get all leave requests
router.get('/', authenticate, async (req, res) => {
  try {
    let query = {};
    
    // If employee, only show their own leaves
    if (req.userRole === 'employee') {
      query.employeeId = req.userId;
    }
    // Manager, HR Staff, and Admin see all leaves
    
    const leaves = await Leave.find(query)
      .populate('employeeId', 'name email department')
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true,
      count: leaves.length,
      data: leaves 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch leave requests', 
      error: error.message 
    });
  }
});

// Get single leave request
router.get('/:id', authenticate, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('employeeId', 'name email department');
    
    if (!leave) {
      return res.status(404).json({ 
        success: false,
        message: 'Leave request not found' 
      });
    }
    
    res.json({ 
      success: true,
      data: leave 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch leave request', 
      error: error.message 
    });
  }
});

// Approve/Reject leave (Manager, HR Staff, Admin only)
router.patch('/:id', authenticate, authorize('manager', 'hr_staff', 'admin'), async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    
    const leave = await Leave.findById(req.params.id)
      .populate('employeeId', 'name email');
    
    if (!leave) {
      return res.status(404).json({ 
        success: false,
        message: 'Leave request not found' 
      });
    }
    
    leave.status = status;
    if (status === 'rejected' && rejectionReason) {
      leave.rejectionReason = rejectionReason;
    }
    
    await leave.save();
    
    // Notify employee
    await Notification.create({
      userId: leave.employeeId._id,
      type: 'leave',
      message: `Your ${leave.leaveType} leave request has been ${status}`,
    });
    
    res.json({ 
      success: true,
      message: `Leave request ${status} successfully`,
      data: leave 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to update leave request', 
      error: error.message 
    });
  }
});

// Delete leave request
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const leave = await Leave.findOne({
      _id: req.params.id,
      employeeId: req.userId,
      status: 'pending'
    });
    
    if (!leave) {
      return res.status(404).json({ 
        success: false,
        message: 'Leave request not found or cannot be deleted' 
      });
    }
    
    await leave.deleteOne();
    
    res.json({ 
      success: true,
      message: 'Leave request deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete leave request', 
      error: error.message 
    });
  }
});

module.exports = router;
