const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['pothole', 'garbage', 'broken_light', 'water_leakage', 'graffiti', 'other'],
        message: '{VALUE} is not a valid category'
      },
      lowercase: true,
      trim: true
    },

    severity: {
      type: String,
      required: [true, 'Severity is required'],
      enum: ['minor', 'moderate', 'critical'],
      default: 'moderate'
    },

    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      trim: true
    },

    imageUrl: {
      type: String,
      required: [true, 'Image is required']
    },

    imageThumbnail: {
      type: String
    },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: [true, 'Coordinates are required'],
        validate: {
          validator: function(coords) {
            return coords.length === 2 &&
                   coords[0] >= -180 && coords[0] <= 180 &&
                   coords[1] >= -90 && coords[1] <= 90;
          },
          message: 'Coordinates must be [longitude, latitude] in valid ranges'
        }
      },
      address: String,
      city: String,
      state: String,
      pincode: String
    },

    status: {
      type: String,
      enum: ['reported', 'in_progress', 'resolved', 'rejected'],
      default: 'reported'
    },

    priority: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },

    reportedBy: {
      name: {
        type: String,
        trim: true
      },
      contact: {
        type: String,
        trim: true
      }
    },

    aiConfidence: {
      type: Number,
      min: 0,
      max: 1
    },

    aiModel: {
      type: String,
      default: 'claude-sonnet-4.5'
    },

    votes: {
      type: Number,
      default: 0,
      min: 0
    },

    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },

    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

issueSchema.index({ 'location.coordinates': '2dsphere' });
issueSchema.index({ description: 'text', 'location.address': 'text' });

module.exports = mongoose.model('Issue', issueSchema);