const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

// Configure multer to store in memory
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

/**
 * Upload image to ImgBB
 * POST /api/upload/image
 */
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

    if (!IMGBB_API_KEY) {
      console.error('❌ IMGBB_API_KEY not found in .env');
      return res.status(500).json({
        success: false,
        error: 'Image upload service not configured'
      });
    }

    console.log('📤 Uploading image to ImgBB...');
    console.log('File size:', req.file.size, 'bytes');
    console.log('File type:', req.file.mimetype);

    // Convert buffer to base64
    const base64Image = req.file.buffer.toString('base64');

    // Create form data
    const formData = new FormData();
    formData.append('image', base64Image);

    // Upload to ImgBB
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );

    if (!response.data.success) {
      throw new Error('ImgBB upload failed');
    }

    const imageData = response.data.data;
    const imageUrl = imageData.url;

    console.log('✅ Image uploaded successfully:', imageUrl);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl: imageUrl,
        thumbnailUrl: imageData.thumb?.url || imageUrl,
        publicId: imageData.id,
        deleteUrl: imageData.delete_url
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error.message);
    
    if (error.response) {
      console.error('ImgBB API Error:', error.response.data);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload image: ' + error.message
    });
  }
});

/**
 * Health check endpoint
 * GET /api/upload/health
 */
router.get('/health', (req, res) => {
  const hasApiKey = !!process.env.IMGBB_API_KEY;
  
  res.json({
    success: true,
    message: 'Upload service is running',
    provider: 'ImgBB',
    configured: hasApiKey,
    maxFileSize: '10MB'
  });
});

module.exports = router;