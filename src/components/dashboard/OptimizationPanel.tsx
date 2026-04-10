import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, CheckCircle, XCircle, Clock, AlertTriangle, TrendingDown } from 'lucide-react';
import { useOptimization } from '@/hooks/useOptimization';
import { useTelemetry } from '@/hooks/useTelemetry';
import { TelemetryData } from '@/types/telemetry';
import { toast } from 'sonner';
import AgentBuilder from './AgentBuilder';

interface OptimizationPanelProps {
  latestTelemetryData?: TelemetryData | null;
}

const OptimizationPanel = ({ latestTelemetryData }: OptimizationPanelProps) => {
  const { proposals, loading, addProposal, approveProposal, rejectProposal, history: optimizationHistory, addHistoryEntry } = useOptimization();
  const { history: telemetryHistory } = useTelemetry();

  const handleApprove = (proposalId: string) => {
    approveProposal(proposalId);
    toast.success('Optimization approved', {
      description: 'Action will be applied and monitored for 60 minutes'
    });
  };

  const handleReject = (proposalId: string) => {
    rejectProposal(proposalId);
    toast.error('Optimization rejected', {
      description: 'Action will not be applied to plant systems'
    });
  };

  const handleAnalysisComplete = (historyItem: any) => {
    addHistoryEntry(historyItem);
  };

  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="p-4 sm:p-6 animate-pulse">
            <div className="space-y-2 sm:space-y-3">
              <div className="h-5 sm:h-6 bg-muted rounded w-3/4" />
              <div className="h-3 sm:h-4 bg-muted rounded w-1/2" />
              <div className="h-16 sm:h-20 bg-muted rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* AI Status Header */}
      {/* <Card className="p-4 sm:p-6 bg-gradient-primary border-primary/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-primary-foreground">
                AI Optimization Engine
              </h2>
              <p className="text-xs sm:text-sm text-primary-foreground/80">
                Powered by Vertex AI • Gemini Models • Agent Builder
              </p>
            </div>
          </div>
          <Badge className="bg-success text-success-foreground text-xs">
            Active
          </Badge>
        </div>
      </Card> */}

      {/* Agent Builder */}
      <AgentBuilder 
        telemetryHistory={telemetryHistory} 
        onProposalGenerated={addProposal} 
        onAnalysisComplete={handleAnalysisComplete}
      />

      {/* Current Proposals */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <h3 className="text-base sm:text-lg font-semibold">Pending Optimization Proposals</h3>
          <span className="text-xs sm:text-sm text-muted-foreground">
            {proposals.length} active recommendation{proposals.length !== 1 ? 's' : ''}
          </span>
        </div>

        {proposals.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center border-dashed">
            <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">
              No pending proposals. Run the AI Agent to generate recommendations.
            </p>
          </Card>
        ) : (
          proposals.map((proposal) => (
            <Card 
              key={proposal.id} 
              className="p-4 sm:p-6 border-l-4 transition-all hover:shadow-card"
              style={{ 
                borderLeftColor: proposal.risk_level === 'low' ? 'hsl(var(--success))' : 
                                proposal.risk_level === 'medium' ? 'hsl(var(--warning))' : 
                                'hsl(var(--destructive))' 
              }}
            >
              <div className="space-y-3 sm:space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant={
                        proposal.risk_level === 'low' ? 'default' :
                        proposal.risk_level === 'medium' ? 'outline' :
                        'destructive'
                      } className="text-xs">
                        {proposal.risk_level} risk
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Confidence: {(proposal.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold">{proposal.action}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {new Date(proposal.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Expected Impact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Energy Impact</p>
                    <div className="flex items-center gap-2">
                      <TrendingDown className={`h-3 w-3 sm:h-4 sm:w-4 ${proposal.expected_energy_delta_kwh_ton < 0 ? 'text-success' : 'text-destructive'}`} />
                      <span className={`text-base sm:text-lg font-bold ${proposal.expected_energy_delta_kwh_ton < 0 ? 'text-success' : 'text-destructive'}`}>
                        {proposal.expected_energy_delta_kwh_ton > 0 ? '+' : ''}{proposal.expected_energy_delta_kwh_ton.toFixed(1)} kWh/ton
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Quality Impact</p>
                    <Badge variant={
                      proposal.expected_quality_impact === 'negligible' ? 'default' :
                      proposal.expected_quality_impact === 'minor' ? 'outline' :
                      'destructive'
                    } className="text-xs">
                      {proposal.expected_quality_impact}
                    </Badge>
                  </div>
                </div>

                {/* Gemini Rationale */}
                <div className="p-3 sm:p-4 bg-card rounded-lg border border-border">
                  <p className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-2">
                    <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    AI Explanation
                  </p>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                    {proposal.rationale}
                  </p>
                </div>

                {/* Safety Gate Status */}
                <div className={`flex items-center gap-2 p-2.5 sm:p-3 rounded-lg ${
                  proposal.safety_gate_decision === 'approved' ? 'bg-success/10 text-success' :
                  proposal.safety_gate_decision === 'escalated' ? 'bg-warning/10 text-warning' :
                  'bg-destructive/10 text-destructive'
                }`}>
                  {proposal.safety_gate_decision === 'approved' ? (
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  ) : proposal.safety_gate_decision === 'escalated' ? (
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm font-medium">
                    Safety Gate: {proposal.safety_gate_decision}
                    {proposal.safety_rejection_reason && ` - ${proposal.safety_rejection_reason}`}
                  </span>
                </div>

                {/* Actions */}
                {proposal.safety_gate_decision === 'approved' && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2">
                    <Button 
                      onClick={() => handleApprove(proposal.id)}
                      className="flex-1 bg-gradient-success text-sm"
                    >
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Approve & Apply
                    </Button>
                    <Button 
                      onClick={() => handleReject(proposal.id)}
                      variant="outline"
                      className="flex-1 text-sm"
                    >
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Recent History */}
      <Card className="p-4 sm:p-6 bg-gradient-surface border-border">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Recent Optimization History</h3>
        <div className="space-y-2">
          {optimizationHistory.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <span className="text-xs sm:text-sm text-muted-foreground font-mono">{item.time}</span>
                <span className="text-xs sm:text-sm">{item.action}</span>
              </div>
              <Badge variant={item.status === 'success' ? 'default' : 'outline'} className="text-xs self-start sm:self-auto">
                {item.result}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default OptimizationPanel;