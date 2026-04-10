import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TelemetryData } from '@/types/telemetry';
import { X } from 'lucide-react';
import cementProcessImage from '@/assets/cement-process.png';

interface Hotspot {
  id: string;
  name: string;
  description: string;
  // Position as percentage of image dimensions
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  metrics: (data: TelemetryData | null) => { label: string; value: string; status?: 'normal' | 'warning' | 'critical' }[];
}

const hotspots: Hotspot[] = [
  {
    id: 'quarry',
    name: 'Limestone Quarry',
    description: 'Raw limestone is extracted via blasting and excavation from open-pit mines.',
    xPct: 2, yPct: 5, widthPct: 14, heightPct: 30,
    metrics: () => [
      { label: 'Material Feed', value: '320 TPH', status: 'normal' },
      { label: 'Quality Grade', value: 'A+' },
      { label: 'Moisture', value: '3.2%' },
    ],
  },
  {
    id: 'excavator',
    name: 'Excavator',
    description: 'Hydraulic excavators load blasted limestone onto dump trucks for transport.',
    xPct: 4, yPct: 38, widthPct: 12, heightPct: 22,
    metrics: () => [
      { label: 'Bucket Capacity', value: '6 m³' },
      { label: 'Cycle Time', value: '28 sec' },
      { label: 'Status', value: 'Operating', status: 'normal' },
    ],
  },
  {
    id: 'dump_truck',
    name: 'Dump Truck',
    description: 'Haul trucks transport raw limestone from quarry to the crusher.',
    xPct: 24, yPct: 2, widthPct: 16, heightPct: 25,
    metrics: () => [
      { label: 'Payload', value: '40 MT' },
      { label: 'Trips/Day', value: '85' },
      { label: 'Fuel Usage', value: '12.5 L/hr' },
    ],
  },
  {
    id: 'crusher',
    name: 'Primary Crusher',
    description: 'Jaw crusher reduces large rocks to ~75mm pieces.',
    xPct: 52, yPct: 2, widthPct: 14, heightPct: 30,
    metrics: () => [
      { label: 'Throughput', value: '280 TPH' },
      { label: 'Output Size', value: '< 75mm' },
      { label: 'Power Draw', value: '320 kW', status: 'normal' },
    ],
  },
  {
    id: 'secondary_crusher',
    name: 'Secondary Crusher',
    description: 'Impact crusher further reduces material to ~25mm for raw milling.',
    xPct: 74, yPct: 2, widthPct: 14, heightPct: 30,
    metrics: () => [
      { label: 'Reduction Ratio', value: '3:1' },
      { label: 'Output Size', value: '< 25mm' },
      { label: 'Vibration', value: 'Normal', status: 'normal' },
    ],
  },
  {
    id: 'proportioning',
    name: 'Proportioning Equipment',
    description: 'Precisely blends limestone, clay, sand, and iron ore to achieve target chemistry.',
    xPct: 74, yPct: 42, widthPct: 18, heightPct: 22,
    metrics: (data) => [
      { label: 'CaO', value: `${data?.raw_caO?.toFixed(1) || '65.0'}%` },
      { label: 'SiO₂', value: `${data?.raw_siO2?.toFixed(1) || '21.0'}%` },
      { label: 'Al₂O₃', value: `${data?.raw_al2O3?.toFixed(1) || '5.0'}%` },
      { label: 'Fe₂O₃', value: `${data?.raw_fe2O3?.toFixed(1) || '3.5'}%` },
    ],
  },
  {
    id: 'sand_clay',
    name: 'Sand & Clay Storage',
    description: 'Additives (sand, clay) stored in separate hoppers for precise proportioning.',
    xPct: 82, yPct: 22, widthPct: 16, heightPct: 22,
    metrics: () => [
      { label: 'Sand Level', value: '72%' },
      { label: 'Clay Level', value: '65%' },
      { label: 'Iron Ore', value: '88%' },
    ],
  },
  {
    id: 'raw_mill',
    name: 'Grinding Mill',
    description: 'Ball/vertical roller mill grinds raw materials into fine powder (raw meal).',
    xPct: 44, yPct: 38, widthPct: 16, heightPct: 22,
    metrics: (data) => [
      { label: 'Power', value: `${data?.mill_power_kw?.toFixed(0) || '1200'} kW`, status: (data?.mill_power_kw || 0) > 1300 ? 'warning' : 'normal' },
      { label: 'Throughput', value: `${data?.mill_throughput_tph?.toFixed(1) || '85'} TPH` },
      { label: 'Sep. Eff.', value: `${((data?.separator_efficiency || 0.85) * 100).toFixed(1)}%`, status: ((data?.separator_efficiency || 0.85) * 100) < 80 ? 'warning' : 'normal' },
    ],
  },
  {
    id: 'preheater',
    name: 'Preheater Tower',
    description: '5-stage cyclone preheater uses kiln exhaust to preheat raw meal to ~800°C.',
    xPct: 28, yPct: 28, widthPct: 12, heightPct: 32,
    metrics: () => [
      { label: 'Stage Temp', value: '~800°C', status: 'normal' },
      { label: 'Cyclone Stages', value: '5' },
      { label: 'Gas Temp Out', value: '320°C' },
    ],
  },
  {
    id: 'kiln',
    name: 'Rotary Kiln',
    description: 'The heart of cement production — raw meal heated to 1450°C to form clinker.',
    xPct: 12, yPct: 38, widthPct: 18, heightPct: 22,
    metrics: (data) => [
      { label: 'Temperature', value: `${data?.kiln_temp_c?.toFixed(0) || '1450'}°C`, status: (data?.kiln_temp_c || 1450) > 1500 ? 'critical' : (data?.kiln_temp_c || 1450) < 1400 ? 'warning' : 'normal' },
      { label: 'Energy', value: `${data?.energy_per_ton_kwh?.toFixed(1) || '88'} kWh/t` },
      { label: 'Therm. Sub.', value: `${data?.thermal_substitution_rate?.toFixed(1) || '32'}%`, status: (data?.thermal_substitution_rate || 32) < 25 ? 'warning' : 'normal' },
    ],
  },
  {
    id: 'clinker_cooler',
    name: 'Clinker Cooler',
    description: 'Grate cooler rapidly cools clinker from 1400°C to ~100°C with heat recovery.',
    xPct: 2, yPct: 62, widthPct: 20, heightPct: 22,
    metrics: (data) => [
      { label: 'Fan RPM', value: `${data?.cooler_fan_rpm?.toFixed(0) || '1250'}` },
      { label: 'Clinker Temp', value: `${data?.clinker_temp_c?.toFixed(0) || '95'}°C` },
      { label: 'Heat Recovery', value: '72%', status: 'normal' },
    ],
  },
  {
    id: 'finish_mill',
    name: 'Finish Grinding Mill',
    description: 'Clinker ground with gypsum (3-5%) into final cement powder.',
    xPct: 38, yPct: 72, widthPct: 28, heightPct: 20,
    metrics: () => [
      { label: 'Blaine', value: '3800 cm²/g' },
      { label: 'Gypsum', value: '4.2%' },
      { label: 'Residue 45μ', value: '12.5%', status: 'normal' },
    ],
  },
  {
    id: 'cement_storage',
    name: 'Cement Storage Silos',
    description: 'Finished cement stored in large silos before dispatch.',
    xPct: 76, yPct: 62, widthPct: 18, heightPct: 28,
    metrics: () => [
      { label: 'Silo 1', value: '78%', status: 'normal' },
      { label: 'Silo 2', value: '45%' },
      { label: 'Grade', value: 'OPC 53' },
    ],
  },
  {
    id: 'shipping',
    name: 'Shipping & Dispatch',
    description: 'Cement dispatched via bulk tankers and packed bags.',
    xPct: 84, yPct: 88, widthPct: 14, heightPct: 10,
    metrics: () => [
      { label: 'Daily Dispatch', value: '4200 MT' },
      { label: 'Trucks/Day', value: '140' },
      { label: 'Bag Packing', value: '800 bags/hr' },
    ],
  },
];

interface CementProcessDiagramProps {
  latestData: TelemetryData | null;
}

const CementProcessDiagram = ({ latestData }: CementProcessDiagramProps) => {
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);

  // Pulse animation for active equipment
  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 1200);
    return () => clearInterval(interval);
  }, []);

  const getStatusDot = (status?: string) => {
    if (status === 'critical') return 'bg-destructive';
    if (status === 'warning') return 'bg-warning';
    return 'bg-success';
  };

  return (
    <Card className="p-2 sm:p-3 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-foreground">
            Cement Manufacturing Plant
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Click on any equipment to view live metrics
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          <span className="text-[10px] text-success font-medium">LIVE</span>
        </div>
      </div>

      {/* Image container with hotspot overlays */}
      <div className="flex-1 relative rounded-lg overflow-hidden border border-border bg-card min-h-0">
        <img
          src={cementProcessImage}
          alt="Cement Manufacturing Process"
          className="w-full h-full object-contain"
          draggable={false}
        />

        {/* Hotspot overlays */}
        {hotspots.map((spot) => {
          const isHovered = hoveredId === spot.id;
          const isSelected = selectedHotspot?.id === spot.id;
          const isActive = ['kiln', 'raw_mill', 'clinker_cooler', 'preheater'].includes(spot.id);

          return (
            <div
              key={spot.id}
              className="absolute cursor-pointer transition-all duration-200"
              style={{
                left: `${spot.xPct}%`,
                top: `${spot.yPct}%`,
                width: `${spot.widthPct}%`,
                height: `${spot.heightPct}%`,
              }}
              onClick={() => setSelectedHotspot(isSelected ? null : spot)}
              onMouseEnter={() => setHoveredId(spot.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Highlight overlay */}
              <div
                className={`absolute inset-0 rounded-md border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary/15 shadow-lg'
                    : isHovered
                    ? 'border-primary/60 bg-primary/10'
                    : 'border-transparent hover:border-primary/30'
                }`}
              />

              {/* Active pulse indicator */}
              {isActive && (
                <div className="absolute -top-1 -right-1 z-10">
                  <span className={`flex h-3 w-3 ${pulse ? 'opacity-100' : 'opacity-60'} transition-opacity`}>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-success border border-background"></span>
                  </span>
                </div>
              )}

              {/* Hover tooltip (quick label) */}
              {isHovered && !isSelected && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  <div className="bg-foreground text-background text-[10px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap">
                    {spot.name}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected equipment detail panel */}
      {selectedHotspot && (
        <div className="mt-2 p-3 rounded-lg bg-muted/50 border border-border animate-fade-in max-h-[200px] overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-foreground">{selectedHotspot.name}</h4>
            <button
              onClick={() => setSelectedHotspot(null)}
              className="text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
            {selectedHotspot.description}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {selectedHotspot.metrics(latestData).map((m, i) => (
              <div key={i} className="p-1.5 rounded bg-card border border-border">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${getStatusDot(m.status)}`} />
                  <p className="text-[9px] text-muted-foreground leading-none">{m.label}</p>
                </div>
                <p className="text-xs font-bold text-foreground">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default CementProcessDiagram;
