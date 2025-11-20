import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Flame, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react';
import kilnFlameImage from '@/assets/kiln-flame.png';

interface FlameAnalysis {
  flameTemp: number;
  coreBrightness: number;
  thermalUniformity: number;
  turbulenceIndex: number;
  fuelAirBalance: 'Rich' | 'Lean' | 'OK';
  volatileBurningEfficiency: number;
  combustionHealthScore: number;
  efficiencyScore: number;
  riskLevel: number;
  recommendedActions: string[];
  advancedMetrics: {
    noxProxy: number;
    ringFormationProbability: number;
    refractoryStressLevel: number;
  };
}

const KilnOperation = () => {
  // Synthetic flame analysis data
  const [analysis] = useState<FlameAnalysis>({
    flameTemp: 1847,
    coreBrightness: 0.87,
    thermalUniformity: 92.3,
    turbulenceIndex: 0.34,
    fuelAirBalance: 'OK',
    volatileBurningEfficiency: 94.2,
    combustionHealthScore: 89,
    efficiencyScore: 91,
    riskLevel: 0.12,
    recommendedActions: [
      'Maintain current fuel-air ratio for optimal combustion',
      'Monitor core brightness for early detection of fuel quality changes',
      'Consider slight reduction in secondary air to improve thermal uniformity',
      'Schedule refractory inspection within 120 operating hours',
    ],
    advancedMetrics: {
      noxProxy: 245,
      ringFormationProbability: 0.08,
      refractoryStressLevel: 0.23,
    },
  });

  const getRiskColor = (risk: number) => {
    if (risk < 0.3) return 'text-success';
    if (risk < 0.6) return 'text-warning';
    return 'text-destructive';
  };

  const getRiskBadge = (risk: number) => {
    if (risk < 0.3) return <Badge className="bg-success">Low Risk</Badge>;
    if (risk < 0.6) return <Badge className="bg-warning">Medium Risk</Badge>;
    return <Badge className="bg-destructive">High Risk</Badge>;
  };

  const getBalanceColor = (balance: string) => {
    if (balance === 'OK') return 'text-success';
    if (balance === 'Lean') return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-alert flex items-center justify-center">
            <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold">Kiln Flame Analysis</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Cloud Vision + Vertex AI Inference</p>
          </div>
        </div>
        {getRiskBadge(analysis.riskLevel)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Flame Image */}
        <div className="space-y-3 sm:space-y-4">
          <div className="relative rounded-lg overflow-hidden border border-border shadow-card">
            <img 
              src={kilnFlameImage} 
              alt="Kiln Flame" 
              className="w-full h-48 sm:h-64 lg:h-80 object-cover"
            />
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-background/90 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-border">
              <p className="text-xs sm:text-sm font-medium">Live Camera Feed</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Image captured: {new Date().toLocaleTimeString()} • Resolution: 1920x1080
          </p>
        </div>

        {/* Analysis Report */}
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Flame Temperature</p>
              <p className="text-lg sm:text-2xl font-bold">{analysis.flameTemp}°C</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Core Brightness</p>
              <p className="text-lg sm:text-2xl font-bold">{analysis.coreBrightness.toFixed(2)}</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Thermal Uniformity</p>
              <p className="text-lg sm:text-2xl font-bold">{analysis.thermalUniformity}%</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Turbulence Index</p>
              <p className="text-lg sm:text-2xl font-bold">{analysis.turbulenceIndex.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Fuel-Air Balance</p>
              <p className={`text-base sm:text-lg font-bold ${getBalanceColor(analysis.fuelAirBalance)}`}>
                {analysis.fuelAirBalance}
              </p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Volatile Burning Eff.</p>
              <p className="text-base sm:text-lg font-bold">{analysis.volatileBurningEfficiency}%</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="p-3 sm:p-4 rounded-lg bg-gradient-success border border-success/20">
              <p className="text-xs text-success-foreground/80 mb-1">Combustion Health</p>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success-foreground" />
                <p className="text-lg sm:text-2xl font-bold text-success-foreground">{analysis.combustionHealthScore}</p>
              </div>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-gradient-primary border border-primary/20">
              <p className="text-xs text-primary-foreground/80 mb-1">Efficiency Score</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                <p className="text-lg sm:text-2xl font-bold text-primary-foreground">{analysis.efficiencyScore}</p>
              </div>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full text-xs sm:text-sm">
                <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                View Advanced Metrics
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Advanced Flame Analysis Metrics</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground mb-2">NOx Proxy (ppm)</p>
                    <p className="text-2xl font-bold">{analysis.advancedMetrics.noxProxy}</p>
                    <p className="text-xs text-muted-foreground mt-1">Within limits</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground mb-2">Ring Formation Risk</p>
                    <p className="text-2xl font-bold">{(analysis.advancedMetrics.ringFormationProbability * 100).toFixed(1)}%</p>
                    <p className="text-xs text-success mt-1">Low probability</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground mb-2">Refractory Stress</p>
                    <p className="text-2xl font-bold">{(analysis.advancedMetrics.refractoryStressLevel * 100).toFixed(1)}%</p>
                    <p className="text-xs text-success mt-1">Normal range</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm font-medium mb-2">Technical Notes</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• NOx proxy calculated from flame temperature and oxygen concentration</li>
                    <li>• Ring formation risk based on thermal profile and material chemistry</li>
                    <li>• Refractory stress derived from temperature gradients and hotspot analysis</li>
                    <li>• All metrics updated every 5 seconds via Cloud Vision API</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <h4 className="text-sm sm:text-base font-semibold">Recommended Actions</h4>
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          {analysis.recommendedActions.map((action, index) => (
            <div key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/30 border border-border">
              <div className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getRiskColor(analysis.riskLevel)} bg-muted`}>
                {index + 1}
              </div>
              <p className="text-xs sm:text-sm text-foreground pt-0.5">{action}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default KilnOperation;
