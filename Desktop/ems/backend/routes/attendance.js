const express = require('express');
const Attendance = require('../models/AttendanceRecord');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Check in
router.post('/check-in', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already checked in today
    const existing = await Attendance.findOne({
      employeeId: req.userId,
      date: { 
        $gte: new Date(today),
        $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false,
        message: 'Already checked in today' 
      });
    }
    
    const attendance = new Attendance({
      employeeId: req.userId,
      date: new Date(),
      checkIn: new Date(),
      status: 'present', // Set status to present on check-in
    });
    
    await attendance.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Checked in successfully',
      data: attendance 
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to check in', 
      error: error.message 
    });
  }
});

// Check out
router.post('/check-out', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const attendance = await Attendance.findOne({
      employeeId: req.userId,
      date: { 
        $gte: new Date(today),
        $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: 'No check-in record found for today' 
      });
    }
    
    if (attendance.checkOut) {
      return res.status(400).json({ 
        success: false,
        message: 'Already checked out today' 
      });
    }
    
    attendance.checkOut = new Date();
    
    // Calculate work hours
    const checkInTime = new Date(attendance.checkIn).getTime();
    const checkOutTime = new Date(attendance.checkOut).getTime();
    attendance.workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    
    await attendance.save();
    
    res.json({ 
      success: true,
      message: 'Checked out successfully',
      data: attendance 
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to check out', 
      error: error.message 
    });
  }
});

// Get attendance records
router.get('/', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    
    let query = {};
    
    // If employee, only show their own records
    if (req.userRole === 'employee') {
      query.employeeId = req.userId;
    }
    
    // If manager, show their department's records (handled by frontend filtering)
    // Admin and HR Staff see all records
    
    // Date filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Employee ID filtering (for admin/HR)
    if (employeeId && ['admin', 'hr_staff', 'manager'].includes(req.userRole)) {
      query.employeeId = employeeId;
    }
    
    const records = await Attendance.find(query)
      .populate('employeeId', 'name email department position')
      .sort({ date: -1, createdAt: -1 });
    
    res.json({ 
      success: true,
      count: records.length,
      data: records 
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch attendance records', 
      error: error.message 
    });
  }
});

// Create attendance record manually (HR Staff, Admin only)
router.post('/record', authenticate, authorize('hr_staff', 'admin'), async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, notes } = req.body;
    
    if (!employeeId || !date || !status) {
      return res.status(400).json({ 
        success: false,
        message: 'Employee ID, date, and status are required' 
      });
    }
    
    // Check if record already exists
    const recordDate = new Date(date);
    const startOfDay = new Date(recordDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(recordDate.setHours(23, 59, 59, 999));
    
    const existing = await Attendance.findOne({
      employeeId,
      date: { 
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    if (existing) {
      // Update existing record
      existing.status = status;
      existing.notes = notes;
      if (checkIn) existing.checkIn = new Date(checkIn);
      if (checkOut) existing.checkOut = new Date(checkOut);
      
      // Calculate work hours if both times provided
      if (existing.checkIn && existing.checkOut) {
        const checkInTime = new Date(existing.checkIn).getTime();
        const checkOutTime = new Date(existing.checkOut).getTime();
        existing.workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
      }
      
      await existing.save();
      
      return res.json({ 
        success: true,
        message: 'Attendance record updated successfully',
        data: existing 
      });
    }
    
    // Create new record
    const attendanceData = {
      employeeId,
      date: new Date(date),
      status,
      notes,
    };
    
    if (checkIn) attendanceData.checkIn = new Date(checkIn);
    if (checkOut) attendanceData.checkOut = new Date(checkOut);
    
    // Calculate work hours if both times provided
    if (attendanceData.checkIn && attendanceData.checkOut) {
      const checkInTime = new Date(attendanceData.checkIn).getTime();
      const checkOutTime = new Date(attendanceData.checkOut).getTime();
      attendanceData.workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    }
    
    const attendance = new Attendance(attendanceData);
    await attendance.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Attendance record created successfully',
      data: attendance 
    });
  } catch (error) {
    console.error('Create attendance record error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create attendance record', 
      error: error.message 
    });
  }
});

// Update attendance record (Admin, HR Staff only)
router.patch('/:id', authenticate, authorize('admin', 'hr_staff'), async (req, res) => {
  try {
    const { status, checkIn, checkOut, notes } = req.body;
    
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: 'Attendance record not found' 
      });
    }
    
    if (status) attendance.status = status;
    if (checkIn) attendance.checkIn = new Date(checkIn);
    if (checkOut) attendance.checkOut = new Date(checkOut);
    if (notes !== undefined) attendance.notes = notes;
    
    // Recalculate work hours
    if (attendance.checkIn && attendance.checkOut) {
      const checkInTime = new Date(attendance.checkIn).getTime();
      const checkOutTime = new Date(attendance.checkOut).getTime();
      attendance.workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    }
    
    await attendance.save();
    
    res.json({ 
      success: true,
      message: 'Attendance record updated successfully',
      data: attendance 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to update attendance record', 
      error: error.message 
    });
  }
});

// Delete attendance record (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: 'Attendance record not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Attendance record deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete attendance record', 
      error: error.message 
    });
  }
});

module.exports = router;
