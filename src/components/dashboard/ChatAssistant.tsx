import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatAssistant = () => {
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

  const sampleResponses = [
    "Based on current telemetry, your energy efficiency is trending well at 94.2 kWh/ton, which is below the target of 95 kWh/ton. The main contributing factors are optimal raw moisture content (1.9%) and efficient separator operation (86.5%).",
    "The recent optimization to reduce mill power was successful because the separator efficiency was running above normal (88%), indicating excess grinding capacity. This allowed us to reduce power while maintaining throughput.",
    "Current thermal substitution rate is 26.8%. To reach the 30% target, I recommend gradually increasing biomass proportion by 2-3% over the next 4 hours, provided kiln temperature remains stable above 1400°C.",
    "The kiln temperature is currently at 1412°C, which is within the safe operating range of 1350-1450°C. This temperature is optimal for clinker formation with your current raw material chemistry (CaO: 62.1%).",
    "Quality variance over the past 24 hours has been low (±1.3 MPa), indicating stable production. The main factors contributing to this stability are consistent raw material chemistry and steady kiln operation."
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate AI response (replace with actual Gemini API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: sampleResponses[Math.floor(Math.random() * sampleResponses.length)],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setLoading(false);
    }, 1500);
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chat Interface */}
      <Card className="lg:col-span-2 flex flex-col h-[700px] bg-gradient-surface">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Gemini Operations Assistant</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered plant intelligence
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-accent-foreground" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about plant operations, optimization decisions, or performance metrics..."
              className="flex-1"
              disabled={loading}
            />
            <Button 
              onClick={handleSend} 
              disabled={loading || !input.trim()}
              className="bg-gradient-primary"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Actions & Context */}
      <div className="space-y-6">
        <Card className="p-6 bg-gradient-surface">
          <h4 className="font-semibold mb-4">Quick Questions</h4>
          <div className="space-y-2">
            {quickPrompts.map((prompt, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => {
                  setInput(prompt);
                  setTimeout(() => handleSend(), 100);
                }}
              >
                <span className="text-sm">{prompt}</span>
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-gradient-surface">
          <h4 className="font-semibold mb-4">Assistant Capabilities</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
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

        <Card className="p-6 bg-gradient-surface border-primary/30">
          <h4 className="font-semibold mb-2 text-primary">Powered by Gemini</h4>
          <p className="text-sm text-muted-foreground">
            This assistant uses Google's Gemini AI model to provide intelligent, context-aware responses about your cement plant operations.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ChatAssistant;
