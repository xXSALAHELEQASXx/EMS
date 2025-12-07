const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  month: { 
    type: Number, 
    required: true,
    min: 1,
    max: 12
  },
  year: { 
    type: Number, 
    required: true 
  },
  baseSalary: { 
    type: Number, 
    required: true 
  },
  bonuses: { 
    type: Number, 
    default: 0 
  },
  deductions: { 
    type: Number, 
    default: 0 
  },
  netSalary: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'processed', 'paid'],
    default: 'pending' 
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidDate: {
    type: Date
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Unique constraint: one payroll per employee per month
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('PayrollRecord', payrollSchema);
