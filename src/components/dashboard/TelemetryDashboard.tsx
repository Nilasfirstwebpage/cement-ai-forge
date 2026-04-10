import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Zap,
  Flame,
  Gauge,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import KilnOperation from "@/components/KilnOperation";
import AIRecommendations from "./AIRecommendations";
import { TelemetryData } from "@/types/telemetry";

interface Trends {
  energy: number;
  temperature: number;
  efficiency: number;
}

interface TelemetryDashboardProps {
  latestData: TelemetryData | null;
  trends: Trends | null;
  loading: boolean;
  history: TelemetryData[];
}

const TelemetryDashboard = ({
  latestData,
  trends,
  loading,
  history,
}: TelemetryDashboardProps) => {
  const metrics = [
    {
      label: "Energy Efficiency",
      value: latestData?.energy_per_ton_kwh || 0,
      unit: "kWh/ton",
      target: [85, 88],
      icon: Zap,
      trend: trends?.energy || 0,
      status:
        (latestData?.energy_per_ton_kwh || 0) < 90 ? "success" : "warning",
    },
    {
      label: "Mill Power",
      value: latestData?.mill_power_kw || 0,
      unit: "kW",
      target: [1200, 1230],
      icon: Activity,
      trend: trends?.power || 0,
      status: "normal",
    },
    {
      label: "Kiln Temperature",
      value: latestData?.kiln_temp_c || 0,
      unit: "°C",
      target: [1450, 1500],
      icon: Flame,
      trend: trends?.kiln_temp || 0,
      status:
        latestData?.kiln_temp_c >= 1450 && latestData?.kiln_temp_c <= 1500
          ? "success"
          : "destructive",
    },
    {
      label: "Throughput",
      value: latestData?.mill_throughput_tph || 0,
      unit: "TPH",
      target: [82, 95],
      icon: Gauge,
      trend: trends?.throughput || 0,
      status: "normal",
    },
    {
      label: "Thermal Substitution",
      value: latestData?.thermal_substitution_rate || 0,
      unit: "%",
      target: [32, 35],
      icon: Activity,
      trend: trends?.thermal_sub || 0,
      status:
        (latestData?.thermal_substitution_rate || 0) >= 30
          ? "success"
          : "warning",
    },
    {
      label: "Separator Efficiency",
      value: (latestData?.separator_efficiency || 0) * 100,
      unit: "%",
      target: [85, 88],
      icon: Gauge,
      trend: trends?.separator || 0,
      status:
        (latestData?.separator_efficiency || 0) * 100 >= 85
          ? "success"
          : "warning",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-success/20 text-success border-success/30";
      case "warning":
        return "bg-warning/20 text-warning border-warning/30";
      case "destructive":
        return "bg-destructive/20 text-destructive border-destructive/30";
      default:
        return "bg-accent/20 text-accent-foreground border-accent/30";
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4 sm:p-6 animate-pulse">
            <div className="h-20 sm:h-24 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Kiln Operation Section */}
      <div className="flex justify-end">
        <p className="text-xs text-muted-foreground">
          {latestData?.timestamp
            ? `Last updated: ${new Date(
                latestData.timestamp
              ).toLocaleTimeString()}`
            : "Waiting for data..."}
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          const isAboveTarget = metric.value > metric.target[1];
          const TrendIcon = metric.trend > 0 ? TrendingUp : TrendingDown;

          return (
            <Card
              key={idx}
              className={`p-4 sm:p-6 border transition-all hover:shadow-card ${getStatusColor(
                metric.status
              )}`}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className={`p-1.5 sm:p-2 rounded-lg ${
                      metric.status === "success"
                        ? "bg-success/20"
                        : metric.status === "warning"
                        ? "bg-warning/20"
                        : metric.status === "destructive"
                        ? "bg-destructive/20"
                        : "bg-accent/20"
                    }`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={metric.status === "success" ? "default" : "outline"}
                  className="text-[10px] sm:text-xs"
                >
                  Target: {metric.target[0]} - {metric.target[1]}
                </Badge>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold">
                    {metric.value.toFixed(1)}
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {metric.unit}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <TrendIcon
                    className={`h-3 w-3 ${
                      metric.trend > 0 ? "text-success" : "text-destructive"
                    }`}
                  />
                  <span
                    className={
                      metric.trend > 0 ? "text-success" : "text-destructive"
                    }
                  >
                    {Math.abs(metric.trend).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">vs last hour</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* AI Recommendations */}
      <AIRecommendations latestData={latestData} />
      <KilnOperation />

      {/* Raw Material Chemistry */}
      <Card className="p-4 sm:p-6 bg-gradient-surface border-border">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Raw Material Chemistry
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: "CaO",
              value: 60,
              unit: "%",
              target: [65, 66],
            },
            {
              label: "SiO₂",
              value: 25,
              unit: "%",
              target: [19, 22],
            },
            {
              label: "Al₂O₃",
              value: 4,
              unit: "%",
              target: [3, 6],
            },
            {
              label: "Fe₂O₃",
              value: 4,
              unit: "%",
              target: [2, 4],
            },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {item.label}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-bold">
                  {item.value.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.unit}
                </span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-primary transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (item.value / ((item.target[0] + item.target[1]) / 2)) *
                        100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Target: {item.target[0]} - {item.target[1]}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Fuel Mix */}
      <Card className="p-4 sm:p-6 bg-gradient-surface border-border">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
          <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Fuel Mix Distribution
        </h3>
        <div className="space-y-2.5 sm:space-y-3">
          {latestData?.fuel_mix && (() => {
            let fuelData;
            try {
              // Handle both string and already-parsed array formats
              fuelData = typeof latestData.fuel_mix === 'string'
                ? JSON.parse(latestData.fuel_mix)
                : latestData.fuel_mix;
            } catch {
              fuelData = [];
            }
            return Array.isArray(fuelData) && fuelData.length > 0 ? fuelData.map((fuel: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium capitalize">{fuel.fuel || 'Unknown'}</span>
                  <span className="text-muted-foreground">
                    {(parseFloat(fuel["%"]) || 0).toFixed(2)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      fuel.fuel === "biomass"
                        ? "bg-gradient-success"
                        : fuel.fuel === "coal"
                        ? "bg-gradient-alert"
                        : "bg-gradient-primary"
                    }`}
                    style={{ width: `${parseFloat(fuel["%"]) || 0}%` }}
                  />
                </div>
              </div>
            )) : (
              <div className="text-sm text-muted-foreground">No fuel mix data available</div>
            );
          })()}
        </div>
      </Card>

      {/* Live Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Energy Efficiency Trend */}
        <Card className="p-4 sm:p-6 bg-gradient-surface border-border">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Energy Efficiency Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                domain={[85, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="energy_per_ton_kwh"
                stroke="hsl(var(--primary))"
                fill="url(#energyGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Kiln Temperature */}
        <Card className="p-4 sm:p-6 bg-gradient-surface border-border">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Kiln Temperature Profile
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                domain={[1350, 1450]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="kiln_temp_c"
                stroke="hsl(var(--warning))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Mill Power & Throughput */}
        <Card className="p-4 sm:p-6 bg-gradient-surface border-border">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Mill Performance
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line
                type="monotone"
                dataKey="mill_power_kw"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="Power (kW)"
              />
              <Line
                type="monotone"
                dataKey="mill_throughput_tph"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={false}
                name="Throughput (TPH)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Thermal Substitution Rate */}
        <Card className="p-4 sm:p-6 bg-gradient-surface border-border">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Gauge className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Thermal Substitution Rate
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={history.slice(-10)}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                domain={[0, 40]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="thermal_substitution_rate"
                fill="hsl(var(--success))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default TelemetryDashboard;
