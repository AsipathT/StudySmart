const express = require('express');
const router = express.Router();
const { register, login, getMe, getAllUsers } = require('../controllers/auth.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getMe);
router.get('/users', verifyToken, isAdmin, getAllUsers);

module.exports = router;
