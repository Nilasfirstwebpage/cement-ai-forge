import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';
import { toast } from 'sonner';
import { getGeminiChatResponse } from './vertexAiService';
import { TelemetryData } from '@/hooks/useTelemetry';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatAssistantProps {
  latestData: TelemetryData | null;
}

const ChatAssistant = ({ latestData }: ChatAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI operations assistant powered by Gemini. I can help you understand plant performance, explain optimization decisions, and answer questions about cement manufacturing processes. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
        const responseContent = await getGeminiChatResponse(newMessages, latestData);
        const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseContent,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
        console.error("Error getting response from Gemini:", error);
        toast.error("An error occurred while fetching the AI response.");
        const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "Sorry, I'm having trouble connecting to my brain right now. Please try again later.",
            timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    "Why is energy efficiency good today?",
    "Explain the last optimization",
    "How can we improve thermal substitution?",
    "What's the kiln temperature status?"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Chat Interface */}
      <Card className="lg:col-span-2 flex flex-col h-[500px] sm:h-[600px] lg:h-[700px] bg-gradient-surface">
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold">Gemini Operations Assistant</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                AI-powered plant intelligence
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 sm:gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-3 sm:p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border'
                  }`}
                >
                  <p className="text-xs sm:text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 ${
                    message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 sm:gap-3">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-pulse" />
                </div>
                <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
                  <div className="flex gap-2">
                    <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-muted-foreground animate-bounce" />
                    <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-3 sm:p-4 lg:p-6 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about operations..."
              className="flex-1 text-xs sm:text-sm"
              disabled={loading}
            />
            <Button 
              onClick={handleSend} 
              disabled={loading || !input.trim()}
              className="bg-gradient-primary px-3 sm:px-4"
              size="sm"
            >
              <Send className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Actions & Context */}
      <div className="space-y-4 sm:space-y-6">
        <Card className="p-4 sm:p-6 bg-gradient-surface">
          <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Quick Questions</h4>
          <div className="space-y-2">
            {quickPrompts.map((prompt, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="w-full justify-start text-left h-auto py-2.5 sm:py-3 px-3 sm:px-4"
                onClick={() => {
                  setInput(prompt);
                  setTimeout(() => handleSend(), 100);
                }}
              >
                <span className="text-xs sm:text-sm">{prompt}</span>
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-6 bg-gradient-surface">
          <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Assistant Capabilities</h4>
          <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Explain optimization decisions in plain language</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Analyze current performance metrics</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Provide process improvement recommendations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Answer questions about cement manufacturing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Interpret quality and efficiency trends</span>
            </li>
          </ul>
        </Card>

        <Card className="p-4 sm:p-6 bg-gradient-surface border-primary/30">
          <h4 className="text-sm sm:text-base font-semibold mb-2 text-primary">Powered by Gemini</h4>
          <p className="text-xs sm:text-sm text-muted-foreground">
            This assistant uses Google's Gemini AI model to provide intelligent, context-aware responses about your cement plant operations.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ChatAssistant;