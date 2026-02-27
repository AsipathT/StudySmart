const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/admin.middleware');
const {
  getAllUsers,
  deleteUser,
  getDashboardStats,
  updateUserRole,
} = require('../controllers/admin.controller');

// All routes here require authentication AND admin role
// Apply middlewares to all routes
router.use(authMiddleware);
router.use(isAdmin);

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats', getDashboardStats);

// @route   GET /api/admin/users
// @desc    Get all users with pagination and search
// @access  Private/Admin
router.get('/users', getAllUsers);

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private/Admin
router.delete('/users/:id', deleteUser);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role (make admin or regular user)
// @access  Private/Admin
router.put('/users/:id/role', updateUserRole);

module.exports = router;
