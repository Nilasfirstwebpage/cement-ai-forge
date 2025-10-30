import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Flame, Gauge, TrendingDown, TrendingUp } from 'lucide-react';
import { useTelemetry } from '@/hooks/useTelemetry';

const TelemetryDashboard = () => {
  const { latestData, trends, loading } = useTelemetry();

  const metrics = [
    {
      label: 'Energy Efficiency',
      value: latestData?.energy_per_ton_kwh || 0,
      unit: 'kWh/ton',
      target: 95,
      icon: Zap,
      trend: trends?.energy || 0,
      status: (latestData?.energy_per_ton_kwh || 0) < 95 ? 'success' : 'warning'
    },
    {
      label: 'Mill Power',
      value: latestData?.mill_power_kw || 0,
      unit: 'kW',
      target: 1250,
      icon: Activity,
      trend: trends?.power || 0,
      status: 'normal'
    },
    {
      label: 'Kiln Temperature',
      value: latestData?.kiln_temp_c || 0,
      unit: '°C',
      target: 1410,
      icon: Flame,
      trend: trends?.kiln_temp || 0,
      status: latestData?.kiln_temp_c >= 1350 && latestData?.kiln_temp_c <= 1450 ? 'success' : 'destructive'
    },
    {
      label: 'Throughput',
      value: latestData?.mill_throughput_tph || 0,
      unit: 'TPH',
      target: 85,
      icon: Gauge,
      trend: trends?.throughput || 0,
      status: 'normal'
    },
    {
      label: 'Thermal Substitution',
      value: latestData?.thermal_substitution_rate || 0,
      unit: '%',
      target: 30,
      icon: Activity,
      trend: trends?.thermal_sub || 0,
      status: (latestData?.thermal_substitution_rate || 0) >= 30 ? 'success' : 'warning'
    },
    {
      label: 'Separator Efficiency',
      value: (latestData?.separator_efficiency || 0) * 100,
      unit: '%',
      target: 85,
      icon: Gauge,
      trend: trends?.separator || 0,
      status: (latestData?.separator_efficiency || 0) >= 0.80 ? 'success' : 'warning'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-success/20 text-success border-success/30';
      case 'warning': return 'bg-warning/20 text-warning border-warning/30';
      case 'destructive': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-accent/20 text-accent-foreground border-accent/30';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-24 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          const isAboveTarget = metric.value > metric.target;
          const TrendIcon = metric.trend > 0 ? TrendingUp : TrendingDown;
          
          return (
            <Card 
              key={idx} 
              className={`p-6 border transition-all hover:shadow-card ${getStatusColor(metric.status)}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    metric.status === 'success' ? 'bg-success/20' :
                    metric.status === 'warning' ? 'bg-warning/20' :
                    metric.status === 'destructive' ? 'bg-destructive/20' :
                    'bg-accent/20'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </p>
                  </div>
                </div>
                <Badge variant={metric.status === 'success' ? 'default' : 'outline'} className="text-xs">
                  Target: {metric.target}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {metric.value.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {metric.unit}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 text-xs">
                  <TrendIcon className={`h-3 w-3 ${metric.trend > 0 ? 'text-success' : 'text-destructive'}`} />
                  <span className={metric.trend > 0 ? 'text-success' : 'text-destructive'}>
                    {Math.abs(metric.trend).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">vs last hour</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Raw Material Chemistry */}
      <Card className="p-6 bg-gradient-surface border-border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Raw Material Chemistry
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'CaO', value: latestData?.raw_caO || 0, unit: '%', target: 62.5 },
            { label: 'SiO₂', value: latestData?.raw_siO2 || 0, unit: '%', target: 21.0 },
            { label: 'Al₂O₃', value: latestData?.raw_al2O3 || 0, unit: '%', target: 5.5 },
            { label: 'Fe₂O₃', value: latestData?.raw_fe2O3 || 0, unit: '%', target: 3.2 }
          ].map((item, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{item.value.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">{item.unit}</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-primary transition-all"
                  style={{ width: `${Math.min(100, (item.value / item.target) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Fuel Mix */}
      <Card className="p-6 bg-gradient-surface border-border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          Fuel Mix Distribution
        </h3>
        <div className="space-y-3">
          {latestData?.fuel_mix && JSON.parse(latestData.fuel_mix).map((fuel: any, idx: number) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize">{fuel.fuel}</span>
                <span className="text-muted-foreground">{fuel['%']}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    fuel.fuel === 'biomass' ? 'bg-gradient-success' :
                    fuel.fuel === 'coal' ? 'bg-gradient-alert' :
                    'bg-gradient-primary'
                  }`}
                  style={{ width: `${fuel['%']}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TelemetryDashboard;
