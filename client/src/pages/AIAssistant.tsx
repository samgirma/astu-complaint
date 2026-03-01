import { Bot, Send } from "lucide-react";
import { useState } from "react";

const AIAssistant = () => {
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Assistant</h1>
        <p className="text-sm text-muted-foreground mt-1">Get help drafting complaints or checking the status of existing ones.</p>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
        {/* Chat area */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-2xl bg-primary/10 mb-4">
            <Bot className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">How can I help you?</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            I can help you draft a complaint, check status, or answer questions about university policies.
          </p>
          <div className="flex flex-wrap gap-2 mt-6 justify-center">
            {["Draft a complaint", "Check complaint status", "University policies"].map((q) => (
              <button
                key={q}
                className="rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 h-10 rounded-lg border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <button className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors shrink-0">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
