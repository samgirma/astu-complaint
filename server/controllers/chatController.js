const { GoogleGenerativeAI } = require('@google/generative-ai');
const { prisma } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AI Chat Endpoint
const chatWithAI = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      success: false,
      message: 'AI service not available'
    });
  }

  try {
    // Get user's recent complaints for context
    const userComplaints = await prisma.complaint.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        createdAt: true
      }
    });

    // Get user role for personalized responses
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, fullName: true }
    });

    // Create context-aware prompt
    const contextPrompt = `You are a helpful AI assistant for the ASTU (Adama Science and Technology University) Smart Complaint & Issue Tracking System. 

User Information:
- Name: ${user.fullName}
- Role: ${user.role}

Recent Complaints Context:
${userComplaints.length > 0 ? userComplaints.map(c => 
  `- ID: ${c.id}, Title: ${c.title}, Category: ${c.category}, Status: ${c.status}, Date: ${c.createdAt.toLocaleDateString()}`
).join('\n') : 'No recent complaints found'}

System Information:
- Categories: Dorm, Lab, Wifi, Classroom, Library, Cafeteria, Other
- Statuses: OPEN, IN_PROGRESS, RESOLVED, CLOSED
- Available actions: Create complaints, check status, add comments, view analytics

Guidelines:
1. Provide helpful, accurate information about the complaint system
2. Be professional and supportive
3. If asked about specific complaints, remind them to check their dashboard for details
4. For technical issues, suggest appropriate categories and provide guidance
5. Keep responses concise but comprehensive
6. If you don't know something, admit it and suggest contacting the appropriate department

User Message: ${message}

Please provide a helpful response:`;

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Generate response
    const result = await model.generateContent(contextPrompt);
    const response = result.response;
    const aiResponse = response.text();

    // Log the conversation for analytics (optional)
    await prisma.comment.create({
      data: {
        content: `AI Chat: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
        complaintId: null, // This is a system comment, not tied to a specific complaint
        userId
      }
    });

    res.status(200).json({
      success: true,
      data: {
        response: aiResponse,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Chat Error:', error);

    // Fallback response if AI fails
    const fallbackResponse = `I apologize, but I'm currently unable to process your request. 

Here are some common actions you can take:
• Create a new complaint using the "Submit Complaint" form
• Check your existing complaints in the dashboard
• Contact the IT department at it-support@astu.edu.et for technical issues
• Visit the student affairs office for other concerns

If you need immediate assistance, please contact the relevant department directly.`;

    res.status(200).json({
      success: true,
      data: {
        response: fallbackResponse,
        timestamp: new Date().toISOString(),
        fallback: true
      }
    });
  }
});

// Get Chat History
const getChatHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get system comments (AI chat logs) for the user
  const chatHistory = await prisma.comment.findMany({
    where: {
      userId: req.user.id,
      content: { startsWith: 'AI Chat:' }
    },
    skip,
    take: parseInt(limit),
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      content: true,
      createdAt: true
    }
  });

  const total = await prisma.comment.count({
    where: {
      userId: req.user.id,
      content: { startsWith: 'AI Chat:' }
    }
  });

  const totalPages = Math.ceil(total / parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      chatHistory: chatHistory.map(chat => ({
        id: chat.id,
        message: chat.content.replace('AI Chat: ', ''),
        timestamp: chat.createdAt,
        type: 'user'
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    }
  });
});

// Get AI Suggestions (for complaint creation)
const getAISuggestions = asyncHandler(async (req, res) => {
  const { category, description } = req.query;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({
      success: true,
      data: {
        suggestions: [
          'Be specific about the issue location',
          'Include when the issue started',
          'Mention any previous attempts to resolve',
          'Provide contact information for follow-up'
        ]
      }
    });
  }

  try {
    const prompt = `Based on the following complaint information, provide helpful suggestions for improving the complaint:

Category: ${category || 'Not specified'}
Description: ${description || 'Not provided'}

Provide 4-5 specific, actionable suggestions for:
1. How to make the complaint more effective
2. What additional information would be helpful
3. Expected resolution timeline
4. Who to contact for immediate assistance

Keep suggestions concise and practical for an ASTU student.`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const aiResponse = response.text();

    // Parse the response into suggestions array
    const suggestions = aiResponse
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(suggestion => suggestion.length > 0);

    res.status(200).json({
      success: true,
      data: {
        suggestions: suggestions.length > 0 ? suggestions : [
          'Be specific about the issue location',
          'Include when the issue started',
          'Mention any previous attempts to resolve',
          'Provide contact information for follow-up'
        ]
      }
    });

  } catch (error) {
    console.error('AI Suggestions Error:', error);

    res.status(200).json({
      success: true,
      data: {
        suggestions: [
          'Be specific about the issue location',
          'Include when the issue started',
          'Mention any previous attempts to resolve',
          'Provide contact information for follow-up'
        ]
      }
    });
  }
});

// Get System Status
const getSystemStatus = asyncHandler(async (req, res) => {
  const [
    totalComplaints,
    activeComplaints,
    resolvedToday,
    newToday,
    systemUptime
  ] = await Promise.all([
    prisma.complaint.count(),
    prisma.complaint.count({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] }
      }
    }),
    prisma.complaint.count({
      where: {
        status: { in: ['RESOLVED', 'CLOSED'] },
        updatedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    prisma.complaint.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    process.uptime()
  ]);

  res.status(200).json({
    success: true,
    data: {
      system: {
        status: 'operational',
        uptime: Math.floor(systemUptime),
        version: '1.0.0'
      },
      statistics: {
        totalComplaints,
        activeComplaints,
        resolvedToday,
        newToday
      },
      ai: {
        available: !!process.env.GEMINI_API_KEY,
        model: 'gemini-pro'
      }
    }
  });
});

module.exports = {
  chatWithAI,
  getChatHistory,
  getAISuggestions,
  getSystemStatus
};
