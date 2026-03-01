// RAG Knowledge Base for ASTU Complaint System AI Assistant
export const knowledgeBase = {
  systemInfo: {
    name: "ASTU Complaint & Issue Tracking System",
    description: "A digital platform for students, staff, and administrators to manage campus complaints efficiently",
    university: "Adama Science and Technology University (ASTU)",
    purpose: "Submit, track, and resolve campus issues transparently"
  },

  departments: [
    {
      name: "Dormitory Services",
      description: "Handles all dormitory-related issues including room maintenance, utilities, and residential life",
      categories: ["Room Maintenance", "Utilities (Water/Electricity)", "Roommate Issues", "Security", "Facilities"],
      contact: "dormitory@astu.edu.et",
      responseTime: "24-48 hours"
    },
    {
      name: "IT Services",
      description: "Manages technology infrastructure, internet services, and computer labs",
      categories: ["WiFi Issues", "Computer Lab Problems", "Software Installation", "Network Access", "Email Issues"],
      contact: "itsupport@astu.edu.et",
      responseTime: "12-24 hours"
    },
    {
      name: "Laboratory Services",
      description: "Oversees lab equipment, safety protocols, and experimental facilities",
      categories: ["Equipment Malfunction", "Safety Concerns", "Material Shortage", "Lab Access", "Technical Support"],
      contact: "lab@astu.edu.et",
      responseTime: "24-72 hours"
    },
    {
      name: "Academic Affairs",
      description: "Handles academic registration, grades, transcripts, and curriculum matters",
      categories: ["Registration Issues", "Grade Disputes", "Transcript Requests", "Course Scheduling", "Academic Advising"],
      contact: "academics@astu.edu.et",
      responseTime: "48-72 hours"
    },
    {
      name: "Library Services",
      description: "Manages library resources, study spaces, and research support",
      categories: ["Book Availability", "Study Space", "Database Access", "Research Help", "Library Cards"],
      contact: "library@astu.edu.et",
      responseTime: "24-48 hours"
    },
    {
      name: "Student Services",
      description: "Provides general student support, counseling, and campus life activities",
      categories: ["General Inquiries", "Counseling Services", "Student Organizations", "Campus Events", "ID Cards"],
      contact: "studentservices@astu.edu.et",
      responseTime: "24-48 hours"
    }
  ],

  complaintProcess: {
    steps: [
      {
        step: 1,
        title: "Submit Complaint",
        description: "Fill out the complaint form with details, select appropriate department, and attach supporting documents",
        tips: ["Be specific about the issue", "Include relevant dates and times", "Attach photos or documents if available"]
      },
      {
        step: 2,
        title: "Review & Assignment",
        description: "Complaint is reviewed and assigned to the appropriate department staff member",
        tips: ["Staff will assess the issue", "Additional information may be requested", "Priority level is determined"]
      },
      {
        step: 3,
        title: "Investigation",
        description: "Department staff investigates the issue and works on resolution",
        tips: ["Staff may contact you for clarification", "Regular updates will be provided", "Resolution time varies by issue"]
      },
      {
        step: 4,
        title: "Resolution",
        description: "Issue is resolved and you're notified of the outcome",
        tips: ["You'll receive resolution details", "Feedback may be requested", "Complaint is marked as resolved"]
      }
    ],
    statusTypes: [
      { status: "OPEN", description: "Complaint received and under review", color: "yellow" },
      { status: "IN_PROGRESS", description: "Staff is actively working on the issue", color: "blue" },
      { status: "RESOLVED", description: "Issue has been resolved", color: "green" },
      { status: "ESCALATED", description: "Issue escalated to higher authority", color: "red" }
    ]
  },

  faqs: [
    {
      question: "How do I submit a complaint?",
      answer: "Log into your student dashboard, click 'Submit New Complaint', fill in the details, select the appropriate department, and submit. You'll receive updates via email."
    },
    {
      question: "How long does it take to resolve a complaint?",
      answer: "Resolution time varies by department and issue complexity. Most issues are resolved within 24-72 hours. You can track the status in your dashboard."
    },
    {
      question: "Can I submit anonymous complaints?",
      answer: "No, complaints require student authentication for accountability and follow-up communication. However, your information is kept confidential and only shared with relevant staff."
    },
    {
      question: "What if I'm not satisfied with the resolution?",
      answer: "You can request a review or escalate the complaint to higher authorities. Use the 'Request Review' option in your complaint details."
    },
    {
      question: "Can I attach files to my complaint?",
      answer: "Yes, you can attach up to 5 files (images, PDFs, documents) up to 5MB each to support your complaint."
    },
    {
      question: "How do I check the status of my complaint?",
      answer: "Log into your dashboard and view 'My Complaints'. Each complaint shows its current status, assigned department, and last update."
    },
    {
      question: "What departments can I send complaints to?",
      answer: "Available departments include: Dormitory Services, IT Services, Laboratory Services, Academic Affairs, Library Services, and Student Services."
    },
    {
      question: "Can I edit my complaint after submission?",
      answer: "You cannot edit complaints after submission, but you can add additional comments or contact the assigned department for updates."
    }
  ],

  tips: {
    effectiveComplaints: [
      "Be clear and specific about the issue",
      "Include relevant dates, times, and locations",
      "Attach supporting documents or photos",
      "Use appropriate department for faster resolution",
      "Follow up politely if no response within expected time"
    ],
    commonMistakes: [
      "Submitting to wrong department",
      "Providing vague descriptions",
      "Not including contact information",
      "Submitting duplicate complaints",
      "Using inappropriate language"
    ]
  },

  emergencyContacts: [
    { service: "Campus Security", phone: "251-XXX-XXXX-XXXX", available: "24/7" },
    { service: "Medical Emergency", phone: "251-XXX-XXXX-XXXX", available: "24/7" },
    { service: "IT Emergency", phone: "251-XXX-XXXX-XXXX", available: "8 AM - 6 PM" },
    { service: "Dormitory Emergency", phone: "251-XXX-XXXX-XXXX", available: "24/7" }
  ]
};

// Helper function to search knowledge base
export const searchKnowledgeBase = (query: string) => {
  const results = [];
  const lowercaseQuery = query.toLowerCase();
  
  // Search departments
  knowledgeBase.departments.forEach(dept => {
    if (dept.name.toLowerCase().includes(lowercaseQuery) || 
        dept.description.toLowerCase().includes(lowercaseQuery) ||
        dept.categories.some(cat => cat.toLowerCase().includes(lowercaseQuery))) {
      results.push({
        type: 'department',
        data: dept,
        relevance: calculateRelevance(query, dept.name + ' ' + dept.description + ' ' + dept.categories.join(' '))
      });
    }
  });
  
  // Search FAQs
  knowledgeBase.faqs.forEach(faq => {
    if (faq.question.toLowerCase().includes(lowercaseQuery) || 
        faq.answer.toLowerCase().includes(lowercaseQuery)) {
      results.push({
        type: 'faq',
        data: faq,
        relevance: calculateRelevance(query, faq.question + ' ' + faq.answer)
      });
    }
  });
  
  // Sort by relevance
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
};

// Simple relevance calculation
const calculateRelevance = (query: string, text: string) => {
  const queryWords = query.toLowerCase().split(' ');
  const textWords = text.toLowerCase().split(' ');
  let matches = 0;
  
  queryWords.forEach(word => {
    if (textWords.some(textWord => textWord.includes(word))) {
      matches++;
    }
  });
  
  return matches / queryWords.length;
};
