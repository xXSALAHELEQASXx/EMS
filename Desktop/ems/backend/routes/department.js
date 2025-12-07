const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Temporary in-memory storage (you can create a Department model later)
let departments = [
  {
    id: '1',
    name: 'Engineering',
    description: 'Software development and technical operations',
    managerId: null,
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Human Resources',
    description: 'Employee relations and recruitment',
    managerId: null,
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Sales',
    description: 'Sales and business development',
    managerId: null,
    createdAt: new Date(),
  },
  {
    id: '4',
    name: 'Marketing',
    description: 'Marketing and brand management',
    managerId: null,
    createdAt: new Date(),
  },
];

// Get all departments
router.get('/', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message,
    });
  }
});

// Get single department
router.get('/:id', authenticate, async (req, res) => {
  try {
    const department = departments.find(d => d.id === req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department',
      error: error.message,
    });
  }
});

// Create department (HR Staff, Admin only)
router.post('/', authenticate, authorize('hr_staff', 'admin'), async (req, res) => {
  try {
    const { name, description, managerId } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required',
      });
    }

    // Check if department already exists
    const exists = departments.find(d => d.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists',
      });
    }

    const newDepartment = {
      id: String(departments.length + 1),
      name,
      description,
      managerId: managerId || null,
      createdAt: new Date(),
    };

    departments.push(newDepartment);

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: newDepartment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create department',
      error: error.message,
    });
  }
});

// Update department (HR Staff, Admin only)
router.patch('/:id', authenticate, authorize('hr_staff', 'admin'), async (req, res) => {
  try {
    const { name, description, managerId } = req.body;
    const departmentIndex = departments.findIndex(d => d.id === req.params.id);

    if (departmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    // Check if new name conflicts with existing department
    if (name) {
      const exists = departments.find(
        d => d.name.toLowerCase() === name.toLowerCase() && d.id !== req.params.id
      );
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'Department with this name already exists',
        });
      }
    }

    // Update department
    if (name) departments[departmentIndex].name = name;
    if (description) departments[departmentIndex].description = description;
    if (managerId !== undefined) departments[departmentIndex].managerId = managerId;

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: departments[departmentIndex],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update department',
      error: error.message,
    });
  }
});

// Delete department (HR Staff, Admin only)
router.delete('/:id', authenticate, authorize('hr_staff', 'admin'), async (req, res) => {
  try {
    const departmentIndex = departments.findIndex(d => d.id === req.params.id);

    if (departmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const deletedDepartment = departments[departmentIndex];
    departments = departments.filter(d => d.id !== req.params.id);

    res.json({
      success: true,
      message: 'Department deleted successfully',
      data: deletedDepartment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete department',
      error: error.message,
    });
  }
});

module.exports = router;
