const errorHandler = (err, req, res, next) => {
  console.error('[Error Caught]', err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    statusCode = 409;
    const keys = Object.keys(err.keyValue || {});
    if (keys.includes('roomNumber')) {
      message = `Room ${err.keyValue.roomNumber} is already occupied by another active patient.`;
    } else if (keys.includes('patient') && keys.includes('recordDate')) {
      message = `A temperature reading has already been recorded for this patient on this date. Use the edit flow to submit corrections.`;
    } else if (keys.includes('patient') && keys.includes('visitDate')) {
      message = `A doctor visit has already been documented for this patient today.`;
    } else if (keys.includes('patientId')) {
      message = `Patient ID '${err.keyValue.patientId}' already exists.`;
    } else if (keys.includes('email')) {
      message = `Email '${err.keyValue.email}' is already registered.`;
    } else {
      message = `Duplicate field value entered: ${JSON.stringify(err.keyValue)}`;
    }
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((val) => val.message);
    message = messages.join('. ');
  }

  // Handle CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with invalid ID format: ${err.value}`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
