const express = require('express');
const router = express.Router();
const { login, demoLogin, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', login);
router.post('/demo-login', demoLogin);
router.get('/me', authenticate, getMe);

module.exports = router;
