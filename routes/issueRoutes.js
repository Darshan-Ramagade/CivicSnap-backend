const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth'); 

// Import controllers
const {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  voteIssue,
  getIssueStats
} = require('../controllers/issueController');

// Import validation middleware
const {
  validateCreateIssue,
  validateUpdateIssue,
  validateQueryParams
} = require('../middleware/validation');

// Routes

// Statistics (must be before /:id route to avoid conflict)
router.get('/stats', getIssueStats);

// CRUD operations
router.route('/')
  .get(validateQueryParams, getAllIssues)      // GET all issues with filters
  .post(validateCreateIssue, createIssue);     // POST create new issue

  router.route('/:id')
  .get(getIssueById)                                // Public - anyone can view
  .patch(protect, adminOnly, validateUpdateIssue, updateIssue)   // ← ADMIN ONLY
  .delete(protect, adminOnly, deleteIssue);                      // DELETE issue

// Vote (public)
router.post('/:id/vote', voteIssue);

module.exports = router;