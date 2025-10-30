import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TelemetryDashboard from '@/components/dashboard/TelemetryDashboard';
import OptimizationPanel from '@/components/dashboard/OptimizationPanel';
import ChatAssistant from '@/components/dashboard/ChatAssistant';
import SystemHealth from '@/components/dashboard/SystemHealth';
import { Activity, Brain, MessageSquare, Shield } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('telemetry');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-surface">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <Activity className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Cement Plant AI Operations
                </h1>
                <p className="text-sm text-muted-foreground">
                  GenAI-Powered Autonomous Optimization Platform
                </p>
              </div>
            </div>
            <SystemHealth />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-card">
            <TabsTrigger value="telemetry" className="gap-2">
              <Activity className="h-4 w-4" />
              Real-Time Telemetry
            </TabsTrigger>
            <TabsTrigger value="optimization" className="gap-2">
              <Brain className="h-4 w-4" />
              AI Optimization
            </TabsTrigger>
            <TabsTrigger value="assistant" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Operator Assistant
            </TabsTrigger>
          </TabsList>

          <TabsContent value="telemetry" className="mt-6 space-y-6">
            <TelemetryDashboard />
          </TabsContent>

          <TabsContent value="optimization" className="mt-6 space-y-6">
            <OptimizationPanel />
          </TabsContent>

          <TabsContent value="assistant" className="mt-6">
            <ChatAssistant />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-success" />
              <span>Safety Gate Active</span>
            </div>
            <div>
              Powered by Google Cloud AI • Gemini • Vertex AI • Cloud Vision
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
