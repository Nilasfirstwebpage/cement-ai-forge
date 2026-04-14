import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TelemetryDashboard from '@/components/dashboard/TelemetryDashboard';
import OptimizationPanel from '@/components/dashboard/OptimizationPanel';
import ChatAssistant from '@/components/dashboard/ChatAssistant';
import SystemHealth from '@/components/dashboard/SystemHealth';
import AgentsOverview from '@/components/dashboard/AgentsOverview';
import CementPlant3D from '@/components/dashboard/CementPlant3D';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Activity, Brain, MessageSquare, Network, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '@/hooks/useTelemetry';

const Index = () => {
  const [activeTab, setActiveTab] = useState('telemetry');
  const navigate = useNavigate();
  const { latestData, loading, history } = useTelemetry();
  const trends = null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-surface">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/')}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <Activity className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-sm sm:text-lg font-bold tracking-tight text-foreground">
                  Cement Plant AI Operations
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  GenAI-Powered Autonomous Optimization Platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SystemHealth />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Split Screen Main Content */}
      <main className="max-w-[1920px] mx-auto">
        <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)]">
          {/* Left Panel — Cement Process Diagram */}
          <div className="lg:w-[45%] xl:w-[40%] border-b lg:border-b-0 lg:border-r border-border p-3 sm:p-4 overflow-auto">
            <CementPlant3D latestData={latestData} />
          </div>

          {/* Right Panel — Dashboard Tabs */}
          <div className="lg:w-[55%] xl:w-[60%] overflow-auto p-3 sm:p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-card gap-1 mb-4">
                <TabsTrigger value="telemetry" className="gap-1 text-xs sm:text-sm">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Telemetry</span>
                  <span className="sm:hidden">Data</span>
                </TabsTrigger>
                <TabsTrigger value="optimization" className="gap-1 text-xs sm:text-sm">
                  <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">AI Optimize</span>
                  <span className="sm:hidden">AI</span>
                </TabsTrigger>
                <TabsTrigger value="assistant" className="gap-1 text-xs sm:text-sm">
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Assistant</span>
                  <span className="sm:hidden">Chat</span>
                </TabsTrigger>
                <TabsTrigger value="agents" className="gap-1 text-xs sm:text-sm">
                  <Network className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="telemetry" className="mt-0 space-y-4">
                <TelemetryDashboard latestData={latestData} trends={trends} loading={loading} history={history} />
              </TabsContent>

              <TabsContent value="optimization" className="mt-0 space-y-4">
                <OptimizationPanel latestTelemetryData={latestData} />
              </TabsContent>

              <TabsContent value="assistant" className="mt-0">
                <ChatAssistant latestData={latestData} />
              </TabsContent>

              <TabsContent value="agents" className="mt-0">
                <AgentsOverview />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6 py-2">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-success" />
              <span>Safety Gate Active</span>
            </div>
            <div>
              Powered by Google Cloud AI • Gemini • Vertex AI
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
