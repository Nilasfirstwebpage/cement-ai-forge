import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Activity, Brain, Shield, Zap, TrendingUp, Network } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Activity,
      title: 'Real-Time Telemetry',
      description: 'Monitor live plant operations with millisecond precision across all production stages.',
      color: 'text-primary',
    },
    {
      icon: Brain,
      title: 'GenAI Optimization',
      description: 'Leverage Google Gemini and Vertex AI for autonomous process optimization and predictive control.',
      color: 'text-success',
    },
    {
      icon: Shield,
      title: 'Safety Gate',
      description: 'Multi-layered safety validation ensures all AI recommendations meet operational constraints.',
      color: 'text-destructive',
    },
    {
      icon: Zap,
      title: 'Energy Efficiency',
      description: 'Reduce energy consumption by up to 15% through intelligent fuel mix and process optimization.',
      color: 'text-warning',
    },
    {
      icon: TrendingUp,
      title: 'Quality Consistency',
      description: 'Maintain target clinker quality with predictive models and real-time adjustments.',
      color: 'text-secondary',
    },
    {
      icon: Network,
      title: 'Multi-Agent System',
      description: 'Orchestrated AI agents for data ingestion, vision analysis, optimization, and operator assistance.',
      color: 'text-accent',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto">
          <div className="flex justify-center">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Activity className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
            </div>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              Cement Plant AI Operations
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              GenAI-Powered Autonomous Optimization Platform
            </p>
          </div>

          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A cutting-edge prototype leveraging <span className="text-primary font-medium">Google Cloud AI</span>, 
            <span className="text-primary font-medium"> Gemini</span>, 
            <span className="text-primary font-medium"> Vertex AI</span>, and 
            <span className="text-primary font-medium"> Cloud Vision</span> to revolutionize cement manufacturing 
            through intelligent automation, predictive analytics, and real-time optimization.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
            >
              Launch Dashboard
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.open('https://docs.google.com', '_blank')}
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
            >
              View Documentation
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="p-4 sm:p-6 hover:shadow-elevated transition-shadow duration-300 border-border/50"
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-muted flex items-center justify-center ${feature.color}`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Technology Stack */}
        <Card className="mt-12 sm:mt-20 p-6 sm:p-8 bg-gradient-surface border-border/50">
          <div className="text-center space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Powered by Google Cloud AI
            </h2>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-background rounded-full border border-border">
                Gemini 2.5 Pro
              </span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-background rounded-full border border-border">
                Vertex AI
              </span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-background rounded-full border border-border">
                Cloud Vision
              </span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-background rounded-full border border-border">
                BigQuery
              </span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-background rounded-full border border-border">
                Agent Builder
              </span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-background rounded-full border border-border">
                Firebase
              </span>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-border/50">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Prototype • Project ID: still-manifest-466507-k0 • Region: asia-south1
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
