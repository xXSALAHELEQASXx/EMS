const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, department, position, baseSalary, managerId } = req.body;
    
    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false,
        message: 'Email, password, and name are required' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = new User({ 
      email, 
      password: hashedPassword, 
      name, 
      role: role || 'employee',
      department,
      position,
      baseSalary,
      managerId
    });
    
    await user.save();

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Registration failed', 
      error: error.message 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check if active
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Account is deactivated' 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true,
      message: 'Login successful',
      token,
      user: { 
        id: user._id,
        _id: user._id,
        name: user.name, 
        email: user.email, 
        role: user.role,
        department: user.department,
        position: user.position,
        baseSalary: user.baseSalary,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Login failed', 
      error: error.message 
    });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('managerId', 'name email');
    
    res.json({ 
      success: true,
      data: user 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch user profile', 
      error: error.message 
    });
  }
});

// Get all users (Admin, HR Staff, Manager only)
router.get('/users', authenticate, authorize('admin', 'hr_staff', 'manager'), async (req, res) => {
  try {
    let query = {};
    
    // If manager, show employees in their department
    if (req.userRole === 'manager') {
      // Get the manager's department
      const manager = await User.findById(req.userId);
      
      if (manager && manager.department) {
        // Show all users in the same department (including the manager)
        query.department = manager.department;
      } else {
        // If manager has no department, only show themselves
        query._id = req.userId;
      }
    }
    // Admin and HR Staff see all users (no filter)
    
    const users = await User.find(query)
      .select('-password')
      .populate('managerId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true,
      count: users.length,
      data: users 
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch users', 
      error: error.message 
    });
  }
});

// Get user by ID (Admin, HR Staff, Manager only)
router.get('/users/:id', authenticate, authorize('admin', 'hr_staff', 'manager'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('managerId', 'name email');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true,
      data: user 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch user', 
      error: error.message 
    });
  }
});

// Update user (Admin, HR Staff only)
router.patch('/users/:id', authenticate, authorize('admin', 'hr_staff'), async (req, res) => {
  try {
    const { name, email, role, department, position, baseSalary, isActive, managerId } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (department) user.department = department;
    if (position) user.position = position;
    if (baseSalary !== undefined) user.baseSalary = baseSalary;
    if (isActive !== undefined) user.isActive = isActive;
    if (managerId !== undefined) user.managerId = managerId;
    
    await user.save();
    
    res.json({ 
      success: true,
      message: 'User updated successfully',
      data: user 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to update user', 
      error: error.message 
    });
  }
});

// Delete user (Admin, HR Staff only)
router.delete('/users/:id', authenticate, authorize('admin', 'hr_staff'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'User deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete user', 
      error: error.message 
    });
  }
});

// Set salary for user (Admin only)
router.patch('/users/:id/salary', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { baseSalary } = req.body;
    
    if (!baseSalary || baseSalary < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid base salary is required'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { baseSalary: parseFloat(baseSalary) },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Salary updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update salary',
      error: error.message
    });
  }
});

// One-time fix: Set default salaries for all users without salary (Admin only)
router.post('/fix-salaries', authenticate, authorize('admin'), async (req, res) => {
  try {
    const defaultSalaries = {
      admin: 6000,
      hr_staff: 4500,
      manager: 5000,
      employee: 3000
    };
    
    const users = await User.find({ 
      $or: [
        { baseSalary: { $exists: false } },
        { baseSalary: 0 },
        { baseSalary: null }
      ]
    });
    
    let updated = 0;
    
    for (const user of users) {
      user.baseSalary = defaultSalaries[user.role] || 3000;
      await user.save();
      updated++;
    }
    
    res.json({
      success: true,
      message: `Updated salaries for ${updated} users`,
      count: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fix salaries',
      error: error.message
    });
  }
});

// Debug route - Check user salaries (remove after debugging)
router.get('/debug/salaries', authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('name email role department baseSalary isActive');
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
