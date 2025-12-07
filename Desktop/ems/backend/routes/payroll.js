const express = require('express');
const Payroll = require('../models/PayrollRecord');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Get all payroll records
router.get('/', authenticate, async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    
    let query = {};
    
    // Employee and Manager only see their own payroll
    if (req.userRole === 'employee' || req.userRole === 'manager') {
      query.employeeId = req.userId;
    }
    // HR Staff and Admin see ALL payroll records (no filter applied)
    
    // If specific filters provided
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (employeeId && ['admin', 'hr_staff'].includes(req.userRole)) {
      query.employeeId = employeeId;
    }
    
    const payrolls = await Payroll.find(query)
      .populate('employeeId', 'name email department position')
      .sort({ year: -1, month: -1, createdAt: -1 });
    
    res.json({ 
      success: true,
      count: payrolls.length,
      data: payrolls 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch payroll records', 
      error: error.message 
    });
  }
});

// Get single payroll record
router.get('/:id', authenticate, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employeeId', 'name email department position');
    
    if (!payroll) {
      return res.status(404).json({ 
        success: false,
        message: 'Payroll record not found' 
      });
    }
    
    // Check access rights
    if (req.userRole === 'employee' && payroll.employeeId._id.toString() !== req.userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }
    
    res.json({ 
      success: true,
      data: payroll 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch payroll record', 
      error: error.message 
    });
  }
});

// Create single payroll record (HR Staff, Admin only)
router.post('/', authenticate, authorize('hr_staff', 'admin'), async (req, res) => {
  try {
    const { employeeId, month, year, baseSalary, bonuses, deductions } = req.body;
    
    // Check if payroll already exists for this employee and period
    const existing = await Payroll.findOne({ employeeId, month, year });
    if (existing) {
      return res.status(400).json({ 
        success: false,
        message: 'Payroll record already exists for this period' 
      });
    }
    
    const bonusAmount = bonuses || 0;
    const deductionAmount = deductions || 0;
    const netSalary = baseSalary + bonusAmount - deductionAmount;
    
    const payroll = new Payroll({
      employeeId,
      month,
      year,
      baseSalary,
      bonuses: bonusAmount,
      deductions: deductionAmount,
      netSalary,
    });
    
    await payroll.save();
    
    // Notify employee
    await Notification.create({
      userId: employeeId,
      type: 'payroll',
      message: `Your payroll for ${month}/${year} has been generated`,
    });
    
    res.status(201).json({ 
      success: true,
      message: 'Payroll record created successfully',
      data: payroll 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to create payroll record', 
      error: error.message 
    });
  }
});

// Bulk generate payroll for all employees (HR Staff, Admin only)
router.post('/bulk-generate', authenticate, authorize('hr_staff', 'admin'), async (req, res) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ 
        success: false,
        message: 'Month and year are required' 
      });
    }
    
    // Get ALL active users (including managers, HR staff, and admins)
    const employees = await User.find({ 
      isActive: true
    });
    
    if (employees.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No active users found' 
      });
    }
    
    const payrollRecords = [];
    const notifications = [];
    let skipped = 0;
    
    for (const employee of employees) {
      // Check if payroll already exists
      const existing = await Payroll.findOne({ 
        employeeId: employee._id, 
        month, 
        year 
      });
      
      if (!existing) {
        // Use baseSalary if exists, otherwise skip
        const baseSalary = employee.baseSalary || 0;
        
        if (baseSalary > 0) {
          // Calculate net salary
          const bonuses = 0;
          const deductions = 0;
          const netSalary = baseSalary + bonuses - deductions;
          
          // Create new payroll record
          const payroll = new Payroll({
            employeeId: employee._id,
            month,
            year,
            baseSalary,
            bonuses,
            deductions,
            netSalary,
          });
          
          await payroll.save();
          payrollRecords.push(payroll);
          
          // Create notification for employee
          notifications.push({
            userId: employee._id,
            type: 'payroll',
            message: `Your payroll for ${month}/${year} has been generated`,
          });
        } else {
          skipped++;
          console.log(`Skipped ${employee.name} (${employee.role}) - no base salary set`);
        }
      }
    }
    
    // Insert all notifications at once
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
    
    res.json({ 
      success: true,
      message: `Payroll generated for ${payrollRecords.length} users${skipped > 0 ? `. Skipped ${skipped} users without salary.` : ''}`,
      count: payrollRecords.length,
      skipped: skipped,
      data: payrollRecords 
    });
  } catch (error) {
    console.error('Bulk payroll generation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate payroll', 
      error: error.message 
    });
  }
});

// Update payroll record (HR Staff, Admin only)
router.patch('/:id', authenticate, authorize('hr_staff', 'admin'), async (req, res) => {
  try {
    const { status, bonuses, deductions } = req.body;
    
    const payroll = await Payroll.findById(req.params.id);
    
    if (!payroll) {
      return res.status(404).json({ 
        success: false,
        message: 'Payroll record not found' 
      });
    }
    
    // Update fields
    if (status) payroll.status = status;
    if (bonuses !== undefined) payroll.bonuses = bonuses;
    if (deductions !== undefined) payroll.deductions = deductions;
    
    // Recalculate net salary
    payroll.netSalary = payroll.baseSalary + payroll.bonuses - payroll.deductions;
    
    await payroll.save();
    
    res.json({ 
      success: true,
      message: 'Payroll record updated successfully',
      data: payroll 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to update payroll record', 
      error: error.message 
    });
  }
});

// Delete payroll record (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndDelete(req.params.id);
    
    if (!payroll) {
      return res.status(404).json({ 
        success: false,
        message: 'Payroll record not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Payroll record deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete payroll record', 
      error: error.message 
    });
  }
});

module.exports = router;
