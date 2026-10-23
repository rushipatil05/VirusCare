const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    // Allow configured origins or any Vercel domain (*.vercel.app)
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    callback(new Error('CORS not allowed for: ' + origin));
  },
  credentials: true,
}));

app.use(express.json());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Ensure database connection for every serverless request (uses cached connection)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[Database Middleware Error]:', err.message);
    res.status(500).json({ success: false, message: 'Database connection failed. Please check MONGODB_URI.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'VirusCare Hospital Management API',
  });
});

// Database Seed endpoint (runs seedData in MongoDB Atlas / cloud)
app.all('/api/seed', async (req, res) => {
  try {
    const seedData = require('./seed');
    await seedData(true);
    res.json({
      success: true,
      message: 'VirusCare database seeded successfully!',
      credentials: {
        admin: { email: 'admin@viruscare.org', password: 'admin123' },
        doctor: { email: 'doctor@viruscare.org', password: 'doctor123' },
        nurse: { email: 'nurse@viruscare.org', password: 'nurse123' },
      },
    });
  } catch (err) {
    console.error('Seed endpoint error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to seed database: ' + err.message,
    });
  }
});

// Mount Routes (with /api and root fallback for flexibility)
const routes = [
  ['/auth', require('./routes/authRoutes')],
  ['/patients', require('./routes/patientRoutes')],
  ['/temperatures', require('./routes/temperatureRoutes')],
  ['/doctor-visits', require('./routes/doctorVisitRoutes')],
  ['/discharges', require('./routes/dischargeRoutes')],
  ['/analytics', require('./routes/analyticsRoutes')],
  ['/config', require('./routes/configRoutes')],
  ['/audit-logs', require('./routes/auditLogRoutes')],
];

routes.forEach(([path, router]) => {
  app.use(`/api${path}`, router);
  app.use(path, router); // Handles calls if VITE_API_BASE_URL misses /api
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only listen when running locally / non-Vercel environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[VirusCare Server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection Error]: ${err.message}`);
});

module.exports = app;
