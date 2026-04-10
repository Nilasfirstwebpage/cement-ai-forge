import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TelemetryDashboard from '@/components/dashboard/TelemetryDashboard';
import OptimizationPanel from '@/components/dashboard/OptimizationPanel';
import ChatAssistant from '@/components/dashboard/ChatAssistant';
import SystemHealth from '@/components/dashboard/SystemHealth';
import AgentsOverview from '@/components/dashboard/AgentsOverview';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Activity, Brain, MessageSquare, Network, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '@/hooks/useTelemetry';

const Index = () => {
  const [activeTab, setActiveTab] = useState('telemetry');
  const navigate = useNavigate();
  const { latestData, trends, loading, history } = useTelemetry();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-surface">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/')}
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  Cement Plant AI Operations
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  GenAI-Powered Autonomous Optimization Platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <SystemHealth />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-2 sm:grid-cols-4 bg-card gap-1">
            <TabsTrigger value="telemetry" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Real-Time Telemetry</span>
              <span className="sm:hidden">Telemetry</span>
            </TabsTrigger>
            <TabsTrigger value="optimization" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">AI Optimization</span>
              <span className="sm:hidden">AI Optimize</span>
            </TabsTrigger>
            <TabsTrigger value="assistant" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Operator Assistant</span>
              <span className="sm:hidden">Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Network className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">System Overview</span>
              <span className="sm:hidden">Overview</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="telemetry" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
            <TelemetryDashboard latestData={latestData} trends={trends} loading={loading} history={history} />
          </TabsContent>

          <TabsContent value="optimization" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
            <OptimizationPanel latestTelemetryData={latestData} />
          </TabsContent>

          <TabsContent value="assistant" className="mt-4 sm:mt-6">
            <ChatAssistant latestData={latestData} />
          </TabsContent>

          <TabsContent value="agents" className="mt-4 sm:mt-6">
            <AgentsOverview />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-8 sm:mt-12">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
              <span>Safety Gate Active</span>
            </div>
            <div className="text-center sm:text-right">
              Powered by Google Cloud AI • Gemini • Vertex AI • Cloud Vision
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
