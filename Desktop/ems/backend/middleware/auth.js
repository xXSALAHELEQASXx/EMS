const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found or inactive' 
      });
    }

    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
  }
};

// Role-based authorization middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};
