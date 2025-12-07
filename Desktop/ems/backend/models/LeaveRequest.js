const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  leaveType: { 
    type: String, 
    enum: ['sick', 'vacation', 'personal', 'emergency', 'maternity', 'paternity'],
    required: true 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  reason: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending' 
  },
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  rejectionReason: {
    type: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
