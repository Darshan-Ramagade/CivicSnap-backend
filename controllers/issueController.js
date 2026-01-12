const Issue = require('../models/Issue');
const { classifyImage } = require('../services/aiService');
const { 
  calculatePriority, 
  formatIssueResponse, 
  buildFilterQuery,
  getPaginationParams 
} = require('../utils/helpers');

/**
 * @desc    Create new issue with AI classification
 * @route   POST /api/issues
 * @access  Public
 */
const createIssue = async (req, res, next) => {
  try {
    const { imageUrl, location, description, reportedBy } = req.body;

    console.log('📸 Creating new issue...');

    // Step 1: Classify image using AI
    console.log('🤖 Running AI classification...');
    const aiResult = await classifyImage(imageUrl);
    console.log('✅ AI Result:', aiResult);

    // Step 2: Prepare issue data
    const issueData = {
      category: aiResult.category,
      severity: aiResult.severity,
      description: description || `${aiResult.category} detected by AI`,
      imageUrl: imageUrl,
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
        address: location.address || '',
        city: location.city || '',
        state: location.state || '',
        pincode: location.pincode || ''
      },
      aiConfidence: aiResult.confidence,
      aiModel: aiResult.model,
      status: 'reported'
    };

    // Add reporter info if provided
    if (reportedBy) {
      issueData.reportedBy = reportedBy;
    }

    // Step 3: Create issue in database
    const issue = await Issue.create(issueData);

    // Step 4: Calculate and update priority
    issue.priority = calculatePriority(issue.severity, issue.votes, issue.createdAt);
    await issue.save();

    console.log('✅ Issue created:', issue._id);

    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      data: formatIssueResponse(issue),
      aiAnalysis: {
        category: aiResult.category,
        confidence: aiResult.confidence,
        severity: aiResult.severity,
        rawLabels: aiResult.rawLabels
      }
    });

  } catch (error) {
    next(error); // Pass to error handler
  }
};

/**
 * @desc    Get all issues with filtering and pagination
 * @route   GET /api/issues
 * @access  Public
 */
const getAllIssues = async (req, res, next) => {
  try {
    // Build filter from query params
    const filter = buildFilterQuery(req.query);
    
    // Get pagination params
    const { page, limit, skip } = getPaginationParams(req.query);

    // Build sort options
    let sortOptions = {};
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.order === 'asc' ? 1 : -1;
      sortOptions[sortField] = sortOrder;
    } else {
      sortOptions = { createdAt: -1 }; // Default: newest first
    }

    console.log('📋 Fetching issues with filter:', filter);

    // Execute query with pagination
    const issues = await Issue.find(filter)
      .sort(sortOptions)
      .limit(limit)
      .skip(skip)
      .select('-__v'); // Exclude version field

    // Get total count for pagination
    const total = await Issue.countDocuments(filter);

    res.json({
      success: true,
      count: issues.length,
      total: total,
      page: page,
      pages: Math.ceil(total / limit),
      data: issues.map(formatIssueResponse)
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single issue by ID
 * @route   GET /api/issues/:id
 * @access  Public
 */
const getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
    }

    // Increment view count
    issue.viewCount += 1;
    await issue.save();

    res.json({
      success: true,
      data: formatIssueResponse(issue)
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update issue (status, severity, etc.)
 * @route   PATCH /api/issues/:id
 * @access  Public (should be protected in production)
 */
const updateIssue = async (req, res, next) => {
  try {
    const updates = req.body;

    // If status is being updated to resolved, set resolvedAt
    if (updates.status === 'resolved') {
      updates.resolvedAt = new Date();
    }

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
    }

    // Recalculate priority if severity changed
    if (updates.severity) {
      issue.priority = calculatePriority(issue.severity, issue.votes, issue.createdAt);
      await issue.save();
    }

    res.json({
      success: true,
      message: 'Issue updated successfully',
      data: formatIssueResponse(issue)
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete issue
 * @route   DELETE /api/issues/:id
 * @access  Public (should be protected in production)
 */
const deleteIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findByIdAndDelete(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
    }

    res.json({
      success: true,
      message: 'Issue deleted successfully',
      data: { id: req.params.id }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upvote an issue
 * @route   POST /api/issues/:id/vote
 * @access  Public
 */
const voteIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
    }

    // Increment votes
    issue.votes += 1;
    
    // Recalculate priority
    issue.priority = calculatePriority(issue.severity, issue.votes, issue.createdAt);
    
    await issue.save();

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        id: issue._id,
        votes: issue.votes,
        priority: issue.priority
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get issue statistics
 * @route   GET /api/issues/stats
 * @access  Public
 */
const getIssueStats = async (req, res, next) => {
  try {
    const stats = await Issue.aggregate([
      {
        $facet: {
          totalCount: [{ $count: 'count' }],
          byCategory: [
            { $group: { _id: '$category', count: { $sum: 1 } } }
          ],
          bySeverity: [
            { $group: { _id: '$severity', count: { $sum: 1 } } }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          avgConfidence: [
            { $group: { _id: null, avg: { $avg: '$aiConfidence' } } }
          ]
        }
      }
    ]);

    const result = stats[0];

    res.json({
      success: true,
      data: {
        total: result.totalCount[0]?.count || 0,
        byCategory: result.byCategory,
        bySeverity: result.bySeverity,
        byStatus: result.byStatus,
        averageAIConfidence: result.avgConfidence[0]?.avg || 0
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  voteIssue,
  getIssueStats
};