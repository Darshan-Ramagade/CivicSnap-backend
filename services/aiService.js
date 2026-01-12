const { HfInference } = require('@huggingface/inference');

// Initialize HuggingFace client (no API key needed for public models)
const hf = new HfInference();

/**
 * Classify an image using HuggingFace Vision Transformer model
 * @param {string} imageUrl - URL of the image to classify
 * @returns {Promise<Object>} Classification result with category, confidence, severity
 */
async function classifyImage(imageUrl) {
  try {
    console.log('🤖 Starting AI classification...');
    console.log('📷 Image URL:', imageUrl);

    // Fetch image from URL
    const axios = require('axios');
    const imageResponse = await axios.get(imageUrl, { 
      responseType: 'arraybuffer' 
    });
    const imageBuffer = Buffer.from(imageResponse.data);

    console.log('✅ Image downloaded, size:', imageBuffer.length, 'bytes');

    // Call HuggingFace API for image classification
    const result = await hf.imageClassification({
      data: imageBuffer,
      model: 'google/vit-base-patch16-224' // Vision Transformer model
    });

    console.log('🎯 Raw AI results:', JSON.stringify(result, null, 2));

    // Map AI labels to our civic issue categories
    const mappedResult = mapToCivicCategories(result);

    console.log('✅ Final classification:', mappedResult);

    return mappedResult;

  } catch (error) {
    console.error('❌ AI Classification Error:', error.message);
    
    // Fallback: return default classification
    return {
      category: 'other',
      confidence: 0.5,
      severity: 'moderate',
      rawLabels: [],
      error: error.message
    };
  }
}

/**
 * Improved mapping function with better keyword matching
 * Maps generic AI labels to our specific civic issue categories
 */
function mapToCivicCategories(aiResults) {
  console.log('🔍 Analyzing AI results:', aiResults);

  const topPredictions = aiResults.slice(0, 5); // Look at top 5 predictions
  
  // Enhanced keyword mappings with more variations
  const categoryMappings = {
    pothole: [
      'pothole', 'hole', 'crack', 'asphalt', 'pavement', 'road damage',
      'concrete', 'street', 'road', 'highway', 'path', 'sidewalk',
      'crater', 'depression', 'broken road', 'damaged pavement',
      'tarmac', 'bitumen', 'pathway', 'roadway', 'thoroughfare'
    ],
    garbage: [
      'garbage', 'trash', 'waste', 'litter', 'rubbish', 'bin', 'dumpster',
      'plastic bag', 'debris', 'refuse', 'junk', 'dump', 'landfill',
      'recycling', 'waste basket', 'waste container', 'trash can',
      'bottle', 'can', 'wrapper', 'paper', 'cardboard', 'waste bin'
    ],
    broken_light: [
      'street light', 'lamp', 'light pole', 'lamppost', 'broken light',
      'street lamp', 'light', 'bulb', 'fixture', 'lighting',
      'pole', 'post', 'illumination', 'dark', 'unlit',
      'spotlight', 'floodlight', 'lantern', 'beacon'
    ],
    water_leakage: [
      'water', 'leak', 'pipe', 'flooding', 'puddle', 'drain', 'sewer',
      'wet', 'moisture', 'flood', 'overflow', 'burst pipe', 'plumbing',
      'hydrant', 'water main', 'drainage', 'sewage',
      'waterfall', 'stream', 'rain', 'liquid', 'fountain'
    ],
    graffiti: [
      'graffiti', 'vandalism', 'spray paint', 'wall art', 'writing',
      'painted', 'tag', 'mural', 'defacement', 'vandalized',
      'street art', 'paint', 'drawing', 'inscription'
    ]
  };

  // Score each category based on ALL top predictions
  const categoryScores = {};
  
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    let score = 0;
    
    topPredictions.forEach((prediction, index) => {
      const label = prediction.label.toLowerCase();
      
      // Check if any keyword is in the label
      keywords.forEach(keyword => {
        if (label.includes(keyword.toLowerCase())) {
          // Weight by position (first predictions worth more) and confidence
          const positionWeight = 1 - (index * 0.15);
          const addedScore = prediction.score * positionWeight;
          score += addedScore;
          
          console.log(`✓ Match found: "${label}" contains "${keyword}" (score: +${addedScore.toFixed(3)})`);
        }
      });
    });
    
    categoryScores[category] = score;
  }

  console.log('📊 Category scores:', categoryScores);

  // Find category with highest score
  const sortedCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1]);
  
  const [bestCategory, bestScore] = sortedCategories[0];
  
  // If no good match found (score too low), return "other"
  if (bestScore < 0.1) {
    console.log('⚠️ No good match found, defaulting to "other"');
    return {
      category: 'other',
      confidence: aiResults[0].score,
      severity: 'moderate',
      rawLabels: topPredictions.map(r => ({ label: r.label, score: r.score })),
      model: 'google/vit-base-patch16-224',
      matchDetails: 'No matching civic issue category found'
    };
  }

  // Determine severity based on confidence
  let severity = 'moderate'; // default
  
  if (bestScore >= 0.7) {
    severity = 'critical';
  } else if (bestScore >= 0.4) {
    severity = 'moderate';
  } else {
    severity = 'minor';
  }

  console.log(`✅ Best match: ${bestCategory} (score: ${bestScore.toFixed(3)}, severity: ${severity})`);

  return {
    category: bestCategory,
    confidence: bestScore,
    severity: severity,
    rawLabels: topPredictions.map(r => ({ label: r.label, score: r.score })),
    model: 'google/vit-base-patch16-224',
    matchDetails: `Matched based on ${bestScore.toFixed(2)} confidence`
  };
}

/**
 * Alternative advanced mapping function
 * Uses weighted scoring across multiple predictions
 * More accurate but computationally intensive
 */
function mapToCivicCategoriesAdvanced(aiResults) {
  const categoryMappings = {
    pothole: ['pothole', 'hole', 'crack', 'asphalt', 'pavement', 'road'],
    garbage: ['garbage', 'trash', 'waste', 'litter', 'bin', 'rubbish'],
    broken_light: ['light', 'lamp', 'pole', 'lamppost', 'street light'],
    water_leakage: ['water', 'leak', 'pipe', 'flood', 'puddle'],
    graffiti: ['graffiti', 'paint', 'wall', 'vandalism']
  };

  // Score each category based on all top predictions
  const categoryScores = {};
  
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    let score = 0;
    
    // Check top 5 AI predictions
    for (let i = 0; i < Math.min(5, aiResults.length); i++) {
      const prediction = aiResults[i];
      const label = prediction.label.toLowerCase();
      
      // If any keyword matches, add weighted score
      for (const keyword of keywords) {
        if (label.includes(keyword.toLowerCase())) {
          // Weight by position (first prediction worth more)
          const positionWeight = 1 - (i * 0.1);
          score += prediction.score * positionWeight;
        }
      }
    }
    
    categoryScores[category] = score;
  }

  // Find category with highest score
  const bestCategory = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])[0];

  const [category, score] = bestCategory;
  
  // Determine severity
  let severity = 'moderate';
  if (score >= 0.7) {
    severity = 'critical';
  } else if (score < 0.4) {
    severity = 'minor';
  }

  return {
    category: score > 0.1 ? category : 'other',
    confidence: score,
    severity: severity,
    rawLabels: aiResults.slice(0, 3).map(r => ({ 
      label: r.label, 
      score: r.score 
    })),
    model: 'google/vit-base-patch16-224'
  };
}

/**
 * Fallback classification based on filename or context
 * Used when AI classification fails
 */
function fallbackClassification(imageUrl) {
  const url = imageUrl.toLowerCase();
  
  // Try to infer from URL/filename
  if (url.includes('pothole') || url.includes('hole') || url.includes('road')) {
    return {
      category: 'pothole',
      confidence: 0.6,
      severity: 'moderate',
      rawLabels: [],
      model: 'fallback-url-based',
      matchDetails: 'Classified based on URL keywords'
    };
  }
  
  if (url.includes('garbage') || url.includes('trash') || url.includes('waste')) {
    return {
      category: 'garbage',
      confidence: 0.6,
      severity: 'moderate',
      rawLabels: [],
      model: 'fallback-url-based',
      matchDetails: 'Classified based on URL keywords'
    };
  }
  
  if (url.includes('light') || url.includes('lamp')) {
    return {
      category: 'broken_light',
      confidence: 0.6,
      severity: 'moderate',
      rawLabels: [],
      model: 'fallback-url-based',
      matchDetails: 'Classified based on URL keywords'
    };
  }
  
  if (url.includes('water') || url.includes('leak') || url.includes('flood')) {
    return {
      category: 'water_leakage',
      confidence: 0.6,
      severity: 'moderate',
      rawLabels: [],
      model: 'fallback-url-based',
      matchDetails: 'Classified based on URL keywords'
    };
  }
  
  // Default fallback
  return {
    category: 'other',
    confidence: 0.5,
    severity: 'moderate',
    rawLabels: [],
    model: 'fallback-default',
    matchDetails: 'Unable to classify, using default'
  };
}

module.exports = {
  classifyImage,
  mapToCivicCategories,
  mapToCivicCategoriesAdvanced,
  fallbackClassification
};