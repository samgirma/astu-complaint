const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Configurable model name
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Helper function for API calls with retry logic
async function callGeminiAPI(prompt, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle rate limiting (429) with retry
        if (response.status === 429 && attempt < retries) {
          console.warn(`Rate limit hit, retrying in ${attempt * 2} seconds... (Attempt ${attempt}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000)); // Exponential backoff
          continue;
        }
        
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      return {
        response: data.candidates[0].content.parts[0].text,
        usage: data.usageMetadata || null
      };

    } catch (error) {
      
      
      if (attempt === retries) {
        throw error; // Re-throw on final attempt
      }
      
      // Wait before retry (except for rate limit which is handled above)
      if (!error.message.includes('429')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

// Gemini AI Chat endpoint
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, context, systemPrompt } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required' 
      });
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      
      return res.status(500).json({ 
        success: false, 
        message: 'AI service not available' 
      });
    }

    // Prepare prompt with context
    const fullPrompt = `${systemPrompt || ''}

Context Information:
${context || 'No specific context provided.'}

User Question: ${message}

Please provide a helpful, accurate response based on context provided.`;

    // Call Gemini API with retry logic
    const result = await callGeminiAPI(fullPrompt);

    res.json({
      success: true,
      response: result.response,
      usage: result.usage
    });

  } catch (error) {
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate AI response',
      error: error.message 
    });
  }
});

// Health check for AI service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'AI Chat Service',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    model: GEMINI_MODEL,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
