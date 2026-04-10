import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TelemetryData } from '@/types/telemetry';
import { X } from 'lucide-react';

interface ProcessStage {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  icon: string;
  metrics: (data: TelemetryData | null) => { label: string; value: string }[];
}

const stages: ProcessStage[] = [
  {
    id: 'quarry',
    name: 'Limestone Quarry',
    description: 'Raw limestone is extracted from open-pit quarries using drilling, blasting, and excavation.',
    x: 20, y: 20, width: 120, height: 70,
    color: 'hsl(var(--muted))',
    icon: '⛏️',
    metrics: () => [
      { label: 'Material Feed', value: '320 TPH' },
      { label: 'Quality Grade', value: 'A+' },
    ],
  },
  {
    id: 'crusher',
    name: 'Primary Crusher',
    description: 'Large limestone rocks are broken down into smaller pieces (75mm) for further processing.',
    x: 180, y: 20, width: 120, height: 70,
    color: 'hsl(var(--warning))',
    icon: '🔨',
    metrics: () => [
      { label: 'Throughput', value: '280 TPH' },
      { label: 'Output Size', value: '< 75mm' },
    ],
  },
  {
    id: 'secondary_crusher',
    name: 'Secondary Crusher',
    description: 'Further size reduction of crushed limestone to approximately 25mm for raw milling.',
    x: 340, y: 20, width: 120, height: 70,
    color: 'hsl(var(--warning))',
    icon: '⚙️',
    metrics: () => [
      { label: 'Reduction Ratio', value: '3:1' },
      { label: 'Output Size', value: '< 25mm' },
    ],
  },
  {
    id: 'proportioning',
    name: 'Proportioning',
    description: 'Raw materials (limestone, clay, sand, iron ore) are proportioned to achieve the correct chemical composition.',
    x: 500, y: 20, width: 120, height: 70,
    color: 'hsl(var(--success))',
    icon: '⚖️',
    metrics: (data) => [
      { label: 'CaO', value: `${data?.raw_caO?.toFixed(1) || '65.0'}%` },
      { label: 'SiO₂', value: `${data?.raw_siO2?.toFixed(1) || '21.0'}%` },
      { label: 'Al₂O₃', value: `${data?.raw_al2O3?.toFixed(1) || '5.0'}%` },
      { label: 'Fe₂O₃', value: `${data?.raw_fe2O3?.toFixed(1) || '3.5'}%` },
    ],
  },
  {
    id: 'raw_mill',
    name: 'Grinding Mill',
    description: 'Raw materials are ground into fine powder (raw meal) for uniform chemical composition.',
    x: 500, y: 140, width: 120, height: 70,
    color: 'hsl(var(--primary))',
    icon: '🏭',
    metrics: (data) => [
      { label: 'Power', value: `${data?.mill_power_kw?.toFixed(0) || '1200'} kW` },
      { label: 'Throughput', value: `${data?.mill_throughput_tph?.toFixed(1) || '85'} TPH` },
      { label: 'Sep. Efficiency', value: `${((data?.separator_efficiency || 0.85) * 100).toFixed(1)}%` },
    ],
  },
  {
    id: 'preheater',
    name: 'Preheater Tower',
    description: 'Multi-stage cyclone preheater uses exhaust gases from kiln to preheat raw meal to ~800°C.',
    x: 340, y: 140, width: 120, height: 70,
    color: 'hsl(var(--destructive))',
    icon: '🔥',
    metrics: () => [
      { label: 'Stage Temp', value: '~800°C' },
      { label: 'Cyclone Stages', value: '5' },
      { label: 'Gas Temp Out', value: '320°C' },
    ],
  },
  {
    id: 'kiln',
    name: 'Rotary Kiln',
    description: 'Heart of the process — raw meal is heated to 1450°C to form clinker through sintering reactions.',
    x: 180, y: 140, width: 120, height: 70,
    color: 'hsl(var(--destructive))',
    icon: '🌋',
    metrics: (data) => [
      { label: 'Temperature', value: `${data?.kiln_temp_c?.toFixed(0) || '1450'}°C` },
      { label: 'Energy', value: `${data?.energy_per_ton_kwh?.toFixed(1) || '88'} kWh/t` },
      { label: 'Therm. Sub.', value: `${data?.thermal_substitution_rate?.toFixed(1) || '32'}%` },
    ],
  },
  {
    id: 'cooler',
    name: 'Clinker Cooler',
    description: 'Hot clinker (~1400°C) is rapidly cooled to ~100°C using grate coolers with fans for heat recovery.',
    x: 20, y: 140, width: 120, height: 70,
    color: 'hsl(var(--accent))',
    icon: '❄️',
    metrics: (data) => [
      { label: 'Fan RPM', value: `${data?.cooler_fan_rpm?.toFixed(0) || '1250'}` },
      { label: 'Clinker Temp', value: `${data?.clinker_temp_c?.toFixed(0) || '95'}°C` },
      { label: 'Heat Recovery', value: '72%' },
    ],
  },
  {
    id: 'finish_mill',
    name: 'Finish Grinding Mill',
    description: 'Clinker is ground with gypsum (3-5%) to produce the final cement powder.',
    x: 20, y: 260, width: 120, height: 70,
    color: 'hsl(var(--primary))',
    icon: '⚡',
    metrics: () => [
      { label: 'Blaine', value: '3800 cm²/g' },
      { label: 'Gypsum Added', value: '4.2%' },
    ],
  },
  {
    id: 'storage',
    name: 'Cement Storage',
    description: 'Finished cement is stored in large silos before being dispatched to customers.',
    x: 180, y: 260, width: 120, height: 70,
    color: 'hsl(var(--muted))',
    icon: '🏗️',
    metrics: () => [
      { label: 'Silo Level', value: '78%' },
      { label: 'Grade', value: 'OPC 53' },
    ],
  },
  {
    id: 'shipping',
    name: 'Shipping',
    description: 'Cement is shipped via bulk tankers or packed in bags for distribution.',
    x: 340, y: 260, width: 120, height: 70,
    color: 'hsl(var(--success))',
    icon: '🚛',
    metrics: () => [
      { label: 'Daily Dispatch', value: '4200 MT' },
      { label: 'Trucks/Day', value: '140' },
    ],
  },
];

// Flow connections between stages
const connections: [string, string][] = [
  ['quarry', 'crusher'],
  ['crusher', 'secondary_crusher'],
  ['secondary_crusher', 'proportioning'],
  ['proportioning', 'raw_mill'],
  ['raw_mill', 'preheater'],
  ['preheater', 'kiln'],
  ['kiln', 'cooler'],
  ['cooler', 'finish_mill'],
  ['finish_mill', 'storage'],
  ['storage', 'shipping'],
];

interface CementProcessDiagramProps {
  latestData: TelemetryData | null;
}

const CementProcessDiagram = ({ latestData }: CementProcessDiagramProps) => {
  const [selectedStage, setSelectedStage] = useState<ProcessStage | null>(null);
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const getStageCenter = (stage: ProcessStage) => ({
    x: stage.x + stage.width / 2,
    y: stage.y + stage.height / 2,
  });

  const getConnectionPath = (fromId: string, toId: string) => {
    const from = stages.find((s) => s.id === fromId)!;
    const to = stages.find((s) => s.id === toId)!;
    const fc = getStageCenter(from);
    const tc = getStageCenter(to);

    // Determine exit/entry points based on relative position
    let x1: number, y1: number, x2: number, y2: number;

    if (Math.abs(fc.y - tc.y) < 20) {
      // Horizontal connection
      if (tc.x > fc.x) {
        x1 = from.x + from.width; y1 = fc.y;
        x2 = to.x; y2 = tc.y;
      } else {
        x1 = from.x; y1 = fc.y;
        x2 = to.x + to.width; y2 = tc.y;
      }
    } else if (tc.y > fc.y) {
      // Going down
      if (Math.abs(fc.x - tc.x) < 20) {
        x1 = fc.x; y1 = from.y + from.height;
        x2 = tc.x; y2 = to.y;
      } else {
        x1 = fc.x; y1 = from.y + from.height;
        x2 = tc.x; y2 = to.y;
      }
    } else {
      // Going up
      x1 = fc.x; y1 = from.y;
      x2 = tc.x; y2 = to.y + to.height;
    }

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    return { path: `M ${x1} ${y1} Q ${mx} ${y1}, ${mx} ${my} Q ${mx} ${y2}, ${x2} ${y2}`, x1, y1, x2, y2 };
  };

  return (
    <Card className="p-3 sm:p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-foreground">Cement Manufacturing Process</h3>
          <p className="text-xs text-muted-foreground">Click any stage to view live metrics</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
          </span>
          <span className="text-xs text-success">Live</span>
        </div>
      </div>

      <div className="flex-1 relative">
        <svg
          viewBox="0 0 660 350"
          className="w-full h-full"
          style={{ minHeight: '300px' }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--primary))" opacity="0.6" />
            </marker>
          </defs>

          {/* Connections */}
          {connections.map(([from, to], idx) => {
            const { path } = getConnectionPath(from, to);
            const dashOffset = -animationPhase * 2;
            return (
              <g key={`conn-${idx}`}>
                <path
                  d={path}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                <path
                  d={path}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeDasharray="6 8"
                  strokeDashoffset={dashOffset}
                  opacity="0.7"
                />
              </g>
            );
          })}

          {/* Stage nodes */}
          {stages.map((stage) => {
            const isHovered = hoveredStage === stage.id;
            const isSelected = selectedStage?.id === stage.id;
            return (
              <g
                key={stage.id}
                onClick={() => setSelectedStage(isSelected ? null : stage)}
                onMouseEnter={() => setHoveredStage(stage.id)}
                onMouseLeave={() => setHoveredStage(null)}
                className="cursor-pointer"
                style={{ transition: 'transform 0.2s' }}
              >
                {/* Shadow */}
                <rect
                  x={stage.x + 2}
                  y={stage.y + 2}
                  width={stage.width}
                  height={stage.height}
                  rx="8"
                  fill="hsl(var(--foreground))"
                  opacity="0.08"
                />
                {/* Main rect */}
                <rect
                  x={stage.x}
                  y={stage.y}
                  width={stage.width}
                  height={stage.height}
                  rx="8"
                  fill="hsl(var(--card))"
                  stroke={isSelected ? 'hsl(var(--primary))' : isHovered ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                  filter={isHovered || isSelected ? 'url(#glow)' : undefined}
                />
                {/* Colored accent bar */}
                <rect
                  x={stage.x}
                  y={stage.y}
                  width={stage.width}
                  height="4"
                  rx="8"
                  fill={stage.color}
                />
                <rect
                  x={stage.x}
                  y={stage.y + 2}
                  width={stage.width}
                  height="4"
                  fill={stage.color}
                />
                {/* Icon */}
                <text
                  x={stage.x + 12}
                  y={stage.y + 30}
                  fontSize="18"
                >
                  {stage.icon}
                </text>
                {/* Name */}
                <text
                  x={stage.x + 36}
                  y={stage.y + 28}
                  fontSize="9"
                  fontWeight="600"
                  fill="hsl(var(--foreground))"
                >
                  {stage.name.length > 14 ? stage.name.slice(0, 14) + '…' : stage.name}
                </text>
                {/* Quick metric */}
                <text
                  x={stage.x + 36}
                  y={stage.y + 42}
                  fontSize="8"
                  fill="hsl(var(--muted-foreground))"
                >
                  {stage.metrics(latestData)[0]?.label}: {stage.metrics(latestData)[0]?.value}
                </text>
                {/* Pulse indicator for active stages */}
                {(stage.id === 'kiln' || stage.id === 'raw_mill') && (
                  <circle
                    cx={stage.x + stage.width - 12}
                    cy={stage.y + 14}
                    r="4"
                    fill="hsl(var(--success))"
                    opacity={0.5 + Math.sin(animationPhase * 0.1) * 0.5}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected stage detail panel */}
      {selectedStage && (
        <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedStage.icon}</span>
              <h4 className="text-sm font-semibold text-foreground">{selectedStage.name}</h4>
            </div>
            <button onClick={() => setSelectedStage(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{selectedStage.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {selectedStage.metrics(latestData).map((m, i) => (
              <div key={i} className="p-2 rounded bg-card border">
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                <p className="text-sm font-bold text-foreground">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default CementProcessDiagram;
