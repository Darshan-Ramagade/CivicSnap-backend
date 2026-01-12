/**
 * Validation Middleware
 * Checks if request data is valid before reaching the controller
 */

// Validate issue creation data
const validateCreateIssue = (req, res, next) => {
    const { imageUrl, location } = req.body;
    const errors = [];
  
    // Check imageUrl
    if (!imageUrl || imageUrl.trim() === '') {
      errors.push('Image URL is required');
    } else if (!isValidUrl(imageUrl)) {
      errors.push('Invalid image URL format');
    }
  
    // Check location
    if (!location) {
      errors.push('Location is required');
    } else {
      if (!location.latitude || !location.longitude) {
        errors.push('Location must include latitude and longitude');
      }
      
      // Validate coordinate ranges
      if (location.latitude < -90 || location.latitude > 90) {
        errors.push('Latitude must be between -90 and 90');
      }
      
      if (location.longitude < -180 || location.longitude > 180) {
        errors.push('Longitude must be between -180 and 180');
      }
    }
  
    // If errors exist, send 400 Bad Request
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors
      });
    }
  
    // If validation passes, continue to next middleware/controller
    next();
  };
  
  // Validate issue update data
  const validateUpdateIssue = (req, res, next) => {
    const { status, severity, category } = req.body;
    const errors = [];
  
    // Only validate fields that are being updated
    if (status) {
      const validStatuses = ['reported', 'in_progress', 'resolved', 'rejected'];
      if (!validStatuses.includes(status)) {
        errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
      }
    }
  
    if (severity) {
      const validSeverities = ['minor', 'moderate', 'critical'];
      if (!validSeverities.includes(severity)) {
        errors.push(`Severity must be one of: ${validSeverities.join(', ')}`);
      }
    }
  
    if (category) {
      const validCategories = ['pothole', 'garbage', 'broken_light', 'water_leakage', 'graffiti', 'other'];
      if (!validCategories.includes(category)) {
        errors.push(`Category must be one of: ${validCategories.join(', ')}`);
      }
    }
  
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors
      });
    }
  
    next();
  };
  
  // Validate query parameters for filtering
  const validateQueryParams = (req, res, next) => {
    const { category, severity, status, limit, page } = req.query;
    const errors = [];
  
    // Validate category filter
    if (category) {
      const validCategories = ['pothole', 'garbage', 'broken_light', 'water_leakage', 'graffiti', 'other'];
      if (!validCategories.includes(category)) {
        errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
      }
    }
  
    // Validate severity filter
    if (severity) {
      const validSeverities = ['minor', 'moderate', 'critical'];
      if (!validSeverities.includes(severity)) {
        errors.push(`Invalid severity. Must be one of: ${validSeverities.join(', ')}`);
      }
    }
  
    // Validate status filter
    if (status) {
      const validStatuses = ['reported', 'in_progress', 'resolved', 'rejected'];
      if (!validStatuses.includes(status)) {
        errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
    }
  
    // Validate pagination
    if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
      errors.push('Limit must be a number between 1 and 100');
    }
  
    if (page && (isNaN(page) || page < 1)) {
      errors.push('Page must be a number greater than 0');
    }
  
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors
      });
    }
  
    next();
  };
  
  // Helper function: Check if string is valid URL
  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
  
  module.exports = {
    validateCreateIssue,
    validateUpdateIssue,
    validateQueryParams
  };