import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Eye, Brain, Shield, MessageSquare, Activity, TrendingUp, Camera, Workflow } from 'lucide-react';

const AgentsOverview = () => {
  const agents = [
    {
      name: 'Data Ingest Agent',
      icon: Database,
      status: 'active',
      description: 'Continuously ingests telemetry from PLCs, MQTT streams, and OPC UA endpoints into BigQuery and GCS.',
      capabilities: [
        'Real-time telemetry capture (1-minute intervals)',
        'Raw material chemistry monitoring',
        'Fuel mix tracking and validation',
        'Equipment status monitoring'
      ],
      tech: ['Cloud Pub/Sub', 'BigQuery', 'Cloud Storage']
    },
    {
      name: 'Cloud Vision Agent',
      icon: Camera,
      status: 'active',
      description: 'Analyzes kiln flame imagery and lab certificate documents to extract structured insights.',
      capabilities: [
        'Kiln flame signature analysis',
        'OCR for lab certificates',
        'Hot spot detection',
        'Anomaly classification'
      ],
      tech: ['Cloud Vision API', 'BigQuery', 'Custom ML Models']
    },
    {
      name: 'Feature Store Agent',
      icon: Activity,
      status: 'active',
      description: 'Transforms raw telemetry into engineered features optimized for model training and inference.',
      capabilities: [
        'Rolling averages and trends',
        'Energy efficiency metrics',
        'Quality indicators',
        'Feature versioning'
      ],
      tech: ['Vertex AI Feature Store', 'BigQuery ML', 'Cloud Functions']
    },
    {
      name: 'Optimization Agent',
      icon: Brain,
      status: 'active',
      description: 'Uses Vertex AI models to propose parameter adjustments that reduce energy consumption and improve quality.',
      capabilities: [
        'Energy per ton predictions',
        'Mill power optimization',
        'Fuel mix recommendations',
        'Kiln temperature control'
      ],
      tech: ['Vertex AI', 'Gemini', 'Custom XGBoost Models']
    },
    {
      name: 'Safety Gate Agent',
      icon: Shield,
      status: 'active',
      description: 'Validates all proposed actions against operational constraints and safety rules before execution.',
      capabilities: [
        'Temperature constraint enforcement',
        'Fuel substitution rate limits',
        'Emergency stop validation',
        'Audit trail logging'
      ],
      tech: ['Agent Builder', 'Firestore', 'Cloud Logging']
    },
    {
      name: 'Operator Assistant',
      icon: MessageSquare,
      status: 'active',
      description: 'Gemini-powered conversational interface for operators to query metrics, understand decisions, and override actions.',
      capabilities: [
        'Natural language queries',
        'Decision explanations',
        'Historical trend analysis',
        'Action override management'
      ],
      tech: ['Gemini API', 'Firebase Realtime Database', 'Agent Builder']
    }
  ];

  const workflow = [
    { step: 1, name: 'Observe', description: 'Data Ingest & Vision agents collect telemetry and images', color: 'bg-primary/20 border-primary/30' },
    { step: 2, name: 'Feature Engineering', description: 'Feature Store Agent transforms raw data', color: 'bg-accent/20 border-accent/30' },
    { step: 3, name: 'Predict & Propose', description: 'Optimization Agent generates recommendations', color: 'bg-success/20 border-success/30' },
    { step: 4, name: 'Validate', description: 'Safety Gate enforces constraints', color: 'bg-warning/20 border-warning/30' },
    { step: 5, name: 'Execute', description: 'Approved actions logged and applied', color: 'bg-primary/20 border-primary/30' }
  ];

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-success/20 text-success border-success/30' : 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* System Architecture Overview */}
      <Card className="p-4 sm:p-6 bg-gradient-surface border-border">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Workflow className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h2 className="text-lg sm:text-2xl font-bold">GenAI Agent Orchestration</h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
          This autonomous platform uses six specialized AI agents coordinated by Google Cloud Agent Builder to continuously optimize cement plant operations. 
          The system observes real-time telemetry, predicts outcomes, proposes optimizations, validates safety, and executes approved actions—all with explainable AI and human oversight.
        </p>

        {/* Workflow Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mt-4 sm:mt-6">
          {workflow.map((item) => (
            <Card key={item.step} className={`p-3 sm:p-4 border transition-all hover:shadow-card ${item.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs sm:text-sm">
                  {item.step}
                </div>
                <h3 className="font-semibold text-xs sm:text-sm">{item.name}</h3>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{item.description}</p>
            </Card>
          ))}
        </div>
      </Card>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {agents.map((agent, idx) => {
          const Icon = agent.icon;
          return (
            <Card key={idx} className="p-4 sm:p-6 bg-gradient-surface border-border transition-all hover:shadow-card">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs sm:text-sm">{agent.name}</h3>
                  </div>
                </div>
                <Badge className={`${getStatusColor(agent.status)} text-xs self-start sm:self-auto`}>
                  {agent.status}
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                {agent.description}
              </p>

              <div className="space-y-2.5 sm:space-y-3">
                <div>
                  <h4 className="text-[10px] sm:text-xs font-semibold text-foreground mb-1.5 sm:mb-2">Key Capabilities</h4>
                  <ul className="space-y-0.5 sm:space-y-1">
                    {agent.capabilities.map((cap, capIdx) => (
                      <li key={capIdx} className="text-[10px] sm:text-xs text-muted-foreground flex items-start gap-1.5 sm:gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-[10px] sm:text-xs font-semibold text-foreground mb-1.5 sm:mb-2">Technologies</h4>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {agent.tech.map((tech, techIdx) => (
                      <Badge key={techIdx} variant="outline" className="text-[9px] sm:text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* How It Works */}
      <Card className="p-4 sm:p-6 bg-gradient-surface border-border">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h2 className="text-base sm:text-xl font-bold">How the Dashboard Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              Real-Time Telemetry Tab
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Displays live operational metrics including energy efficiency, mill power, kiln temperature, throughput, and thermal substitution rates. 
              Data is ingested every minute from PLCs and updated with trend indicators comparing current performance to the last hour.
            </p>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              AI Optimization Tab
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Shows AI-generated optimization proposals with predicted impact on energy consumption and quality. Each proposal includes Gemini-generated rationale 
              and has passed through the Safety Gate. Operators can approve or reject recommendations with full audit logging.
            </p>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              Operator Assistant Tab
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Gemini-powered conversational interface that answers questions about current operations, explains AI decisions, provides historical context, 
              and helps troubleshoot issues using natural language. All responses are grounded in real telemetry data.
            </p>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              System Overview Tab
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              This tab provides visibility into the agent orchestration architecture, explaining how each agent contributes to the autonomous optimization loop 
              and what technologies power the platform.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AgentsOverview;