/**
 * Utility Helper Functions
 */

// Calculate priority score based on severity, votes, and age
const calculatePriority = (severity, votes, createdAt) => {
    // Severity weights
    const severityScores = {
      critical: 70,
      moderate: 50,
      minor: 30
    };
  
    const severityScore = severityScores[severity] || 50;
    
    // Vote score (max 20 points)
    const voteScore = Math.min(votes, 20);
    
    // Age score (newer issues get higher priority)
    const ageInDays = (Date.now() - new Date(createdAt)) / (1000 * 60 * 60 * 24);
    const ageScore = Math.max(0, 10 - ageInDays); // Decreases over 10 days
    
    return Math.round(severityScore + voteScore + ageScore);
  };
  
  // Format issue for response (remove sensitive data)
  const formatIssueResponse = (issue) => {
    const formatted = issue.toObject();
    
    // Remove internal fields if needed
    delete formatted.__v;
    
    return formatted;
  };
  
  // Build MongoDB filter from query parameters
  const buildFilterQuery = (queryParams) => {
    const filter = {};
    
    if (queryParams.category) {
      filter.category = queryParams.category;
    }
    
    if (queryParams.severity) {
      filter.severity = queryParams.severity;
    }
    
    if (queryParams.status) {
      filter.status = queryParams.status;
    }
    
    // Date range filter
    if (queryParams.startDate || queryParams.endDate) {
      filter.createdAt = {};
      if (queryParams.startDate) {
        filter.createdAt.$gte = new Date(queryParams.startDate);
      }
      if (queryParams.endDate) {
        filter.createdAt.$lte = new Date(queryParams.endDate);
      }
    }
    
    return filter;
  };
  
  // Pagination helper
  const getPaginationParams = (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    
    return { page, limit, skip };
  };
  
  module.exports = {
    calculatePriority,
    formatIssueResponse,
    buildFilterQuery,
    getPaginationParams
  };