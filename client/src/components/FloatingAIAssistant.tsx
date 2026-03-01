import { useState, useEffect } from "react";
import { Bot, X, Send, Minimize2, Maximize2, BookOpen, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { searchKnowledgeBase, knowledgeBase } from "@/data/knowledgeBase";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
  sources?: any[];
}

interface FloatingAIAssistantProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function FloatingAIAssistant({ isOpen: initialOpen = false, onToggle }: FloatingAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize with welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: "1",
        text: `Hello ${user?.fullName || 'Student'}! I'm your ASTU Complaint Assistant. I can help you with:\n\n• Finding the right department for your issue\n• Understanding the complaint process\n• Answering questions about the system\n• Providing tips for effective complaints\n\nHow can I assist you today?`,
        sender: "assistant",
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length, user?.fullName]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.();
    
    // Clear chat history when closing
    if (!newState) {
      setMessages([]);
      setInputMessage("");
    }
  };

  const generateContextualResponse = async (userMessage: string) => {
    // Search knowledge base for relevant information
    const searchResults = searchKnowledgeBase(userMessage);
    
    // Build context from search results
    let context = "";
    const sources = [];
    
    searchResults.forEach(result => {
      if (result.type === 'department') {
        const dept = result.data;
        context += `Department: ${dept.name}\nDescription: ${dept.description}\nCategories: ${dept.categories.join(', ')}\nContact: ${dept.contact}\nResponse Time: ${dept.responseTime}\n\n`;
        sources.push({ type: 'department', name: dept.name });
      } else if (result.type === 'faq') {
        const faq = result.data;
        context += `FAQ: ${faq.question}\nAnswer: ${faq.answer}\n\n`;
        sources.push({ type: 'faq', question: faq.question });
      }
    });

    // If no relevant results found, provide general help
    if (searchResults.length === 0) {
      context = `General ASTU Complaint System Information:\n`;
      context += `Available Departments: ${knowledgeBase.departments.map(d => d.name).join(', ')}\n`;
      context += `Complaint Process: ${knowledgeBase.complaintProcess.steps.map(s => s.title).join(' → ')}\n`;
      context += `Status Types: ${knowledgeBase.complaintProcess.statusTypes.map(s => s.status).join(', ')}\n`;
    }

    // Generate response using Gemini API with context
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: userMessage,
          context: context,
          systemPrompt: `You are a specialized AI assistant for the ASTU (Adama Science and Technology University) Complaint & Issue Tracking System. Your purpose is to help students navigate the complaint process effectively.

SYSTEM SCOPE AND BOUNDARIES:
- ONLY answer questions related to the ASTU Complaint & Issue Tracking System
- If asked questions outside this scope (general knowledge, personal advice, academic help, etc.), respond: "I'm specifically designed to help with ASTU complaint system questions only. I cannot answer questions outside the complaint system scope."
- ALL answers must be bounded within the system - do not provide external context or general knowledge

SYSTEM PURPOSE:
The ASTU Complaint System allows students to submit, track, and resolve campus issues transparently. Students submit complaints, which are assigned to appropriate departments for resolution.

HOW STUDENTS SUBMIT COMPLAINTS:
1. Log into student dashboard
2. Click "Submit New Complaint"
3. Fill in complaint details (title, description)
4. Select appropriate department from dropdown
5. Attach supporting documents (optional, max 5 files)
6. Click "Submit Complaint"

DEPARTMENT RESPONSIBILITIES:
- Dormitory Services: Room maintenance, utilities, roommate issues, security, facilities
- IT Services: WiFi issues, computer lab problems, software installation, network access, email issues
- Laboratory Services: Equipment malfunction, safety concerns, material shortage, lab access, technical support
- Academic Affairs: Registration issues, grade disputes, transcript requests, course scheduling, academic advising
- Library Services: Book availability, study space, database access, research help, library cards
- Student Services: General inquiries, counseling services, student organizations, campus events, ID cards

HOW TO HELP STUDENTS CHOOSE DEPARTMENTS:
When students describe their issue, analyze the problem and recommend the most appropriate department based on the department responsibilities above. Ask clarifying questions if needed.

COMPLAINT PROCESS FLOW:
1. SUBMIT → Student submits complaint with details and department selection
2. REVIEW → Staff review and assign complaint to appropriate department member
3. INVESTIGATION → Department staff investigates and works on resolution
4. RESOLUTION → Issue is resolved and student is notified

STATUS TRACKING:
- OPEN: Complaint received and under review
- IN_PROGRESS: Staff actively working on the issue
- RESOLVED: Issue has been marked as resolved by staff
- ESCALATED: Issue escalated to higher authority

WHEN TO CHECK BACK:
- Students should check their dashboard regularly for updates
- Response times vary by department (typically 24-72 hours)
- Students receive email notifications for status changes

IF ISSUE PERSISTS AFTER "RESOLVED":
1. Contact the assigned department directly using the contact information in the complaint
2. Request a review through the dashboard using "Request Review" option
3. If still unresolved, escalate to higher authority through the system
4. Provide additional evidence or details about why the issue persists

RESPONSE GUIDELINES:
- Be helpful, clear, and specific
- Keep responses concise but informative
- Use bullet points and formatting for clarity
- Always stay within the complaint system context
- Do not provide external general knowledge
- Focus on process guidance and department recommendations

Remember: You are a complaint system specialist, not a general AI assistant. Stay within your defined scope.`
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          text: data.response,
          sources: sources.length > 0 ? sources : null
        };
      }
    } catch (error) {
      console.error('AI API Error:', error);
    }

    // Fallback response if API fails
    return {
      text: generateFallbackResponse(userMessage, searchResults),
      sources: sources.length > 0 ? sources : null
    };
  };

  const generateFallbackResponse = (userMessage: string, searchResults: any[]) => {
    const lowercaseMessage = userMessage.toLowerCase();
    
    // Check for out-of-scope questions
    const outOfScopeKeywords = [
      'weather', 'news', 'politics', 'sports', 'entertainment', 'general knowledge',
      'homework help', 'study tips', 'career advice', 'personal advice', 'health advice',
      'cooking', 'travel', 'finance', 'relationships', 'jokes', 'stories'
    ];
    
    if (outOfScopeKeywords.some(keyword => lowercaseMessage.includes(keyword))) {
      return "I'm specifically designed to help with ASTU complaint system questions only. I cannot answer questions outside the complaint system scope.";
    }
    
    // Check for specific keywords related to the complaint system
    if (lowercaseMessage.includes('department') || lowercaseMessage.includes('where') || lowercaseMessage.includes('which')) {
      const relevantDept = searchResults.find(r => r.type === 'department');
      if (relevantDept) {
        const dept = relevantDept.data;
        return `Based on your issue, I recommend the **${dept.name}** department.\n\n**What they handle:** ${dept.description}\n**Categories:** ${dept.categories.join(', ')}\n**Contact:** ${dept.contact}\n**Response Time:** ${dept.responseTime}\n\nWould you like me to help you submit a complaint to this department?`;
      }
      
      return `Available departments include:\n\n${knowledgeBase.departments.map(dept => 
        `• **${dept.name}** - ${dept.description}`
      ).join('\n\n')}\n\nWhich department best fits your issue?`;
    }
    
    if (lowercaseMessage.includes('how') && (lowercaseMessage.includes('submit') || lowercaseMessage.includes('complain'))) {
      return `To submit a complaint:\n\n1. Log into your student dashboard\n2. Click "Submit New Complaint"\n3. Fill in the complaint details (title, description)\n4. Select the appropriate department from dropdown\n5. Attach supporting documents (optional, max 5 files)\n6. Click "Submit Complaint"\n\nYou'll receive email updates as your complaint progresses. Need help choosing a department?`;
    }
    
    if (lowercaseMessage.includes('status') || lowercaseMessage.includes('track') || lowercaseMessage.includes('check back')) {
      return `You can track your complaint status in your student dashboard:\n\n**Status Types:**\n• **OPEN** - Complaint received and under review\n• **IN_PROGRESS** - Staff is actively working on it\n• **RESOLVED** - Issue has been resolved\n• **ESCALATED** - Issue escalated to higher authority\n\n**When to check back:**\n• Check dashboard regularly for updates\n• Response times vary by department (24-72 hours)\n• You'll receive email notifications for status changes`;
    }
    
    if (lowercaseMessage.includes('resolved') && (lowercaseMessage.includes('still') || lowercaseMessage.includes('persist') || lowercaseMessage.includes('fixed'))) {
      return `If your issue persists after being marked "resolved":\n\n1. Contact the assigned department directly using contact info in complaint\n2. Request a review through dashboard using "Request Review" option\n3. If still unresolved, escalate to higher authority through system\n4. Provide additional evidence about why the issue persists\n\nThe system allows for follow-up actions when resolution is inadequate.`;
    }
    
    if (lowercaseMessage.includes('help') || lowercaseMessage.includes('assist')) {
      return `I can help you with:\n\n🔍 **Finding the right department** for your issue\n📝 **Understanding the complaint process**\n❓ **Answering questions** about the system\n💡 **Providing tips** for effective complaints\n📊 **Tracking complaint status**\n🔄 **Follow-up actions** for unresolved issues\n\nWhat specific complaint system question can I help you with?`;
    }
    
    // Default response for unclear requests
    return `I'm here to help with ASTU complaint system questions. I can assist with finding departments, understanding the complaint process, tracking status, and follow-up actions.\n\nTry asking about:\n• Which department handles your issue\n• How to submit a complaint\n• Complaint status tracking\n• What to do if issues persist after "resolved"\n• Response times and follow-up\n\nWhat would you like to know about the complaint system?`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await generateContextualResponse(inputMessage);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: "assistant",
        timestamp: new Date(),
        sources: response.sources
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (text: string) => {
    // Simple markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-3 shadow-lg hover:bg-primary/90 transition-all duration-300 hover:scale-105"
        >
          <Bot className="h-5 w-5" />
          <span className="text-sm font-medium">AI Assistant</span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-background border border-border rounded-xl shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-semibold">ASTU Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={handleToggle}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {message.sender === "assistant" ? (
                        <div dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }} />
                      ) : (
                        message.text
                      )}
                      
                      {/* Show sources for AI responses */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                          <div className="flex items-center gap-1 text-xs opacity-70">
                            <BookOpen className="h-3 w-3" />
                            <span>Sources: {message.sources.map((s, i) => 
                              `${s.name || s.question}${i < message.sources.length - 1 ? ', ' : ''}`
                            )}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about departments, complaints, or help..."
                    className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
