const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['employee', 'manager', 'hr_staff', 'admin'],
    default: 'employee'
  },
  department: { 
    type: String 
  },
  position: { 
    type: String 
  },
  managerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  baseSalary: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', userSchema);
