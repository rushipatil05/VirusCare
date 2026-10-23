const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'viruscare_secure_jwt_secret_token_key_2026', {
    expiresIn: '7d',
  });
};

// @desc Login user
// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please check your credentials.',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Demo quick login (switch roles seamlessly for demo / evaluation)
// @route POST /api/auth/demo-login
const demoLogin = async (req, res, next) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['admin', 'doctor', 'nurse'];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid demo role. Choose admin, doctor, or nurse.',
      });
    }

    let user = await User.findOne({ role });

    // If user does not exist yet (e.g. before seeding), create a default demo user
    if (!user) {
      const demoUsers = {
        admin: { name: 'Pooja Sharma (Admin)', email: 'admin@viruscare.org', password: 'admin123' },
        doctor: { name: 'Dr. Rajesh Kulkarni (Doctor)', email: 'doctor@viruscare.org', password: 'doctor123' },
        nurse: { name: 'Nurse Anjali Nair (Nurse)', email: 'nurse@viruscare.org', password: 'nurse123' },
      };

      const info = demoUsers[role];
      user = await User.create({
        name: info.name,
        email: info.email,
        password: info.password,
        role,
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get current logged-in user profile
// @route GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  demoLogin,
  getMe,
};
