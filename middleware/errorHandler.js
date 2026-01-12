/**
 * Global Error Handler
 * Catches all errors and sends consistent error responses
 */

const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err);
  
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errors
      });
    }
  
    // Mongoose duplicate key error (e.g., duplicate email)
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate field value',
        details: `A record with that ${Object.keys(err.keyValue)[0]} already exists`
      });
    }
  
    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format',
        details: 'The provided ID is not valid'
      });
    }
  
    // Default server error
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  };
  
  module.exports = errorHandler;