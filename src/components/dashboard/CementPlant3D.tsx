import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { TelemetryData } from '@/types/telemetry';
import { X, ChevronRight, Flame, Thermometer, Zap, Wind, Gauge } from 'lucide-react';
import cementPlantImage from '@/assets/cement-plant-3d.jpg';

/* ------------------------------------------------------------------ */
/*  Hotspot definitions – positioned as % of the image                 */
/* ------------------------------------------------------------------ */
interface Hotspot {
  id: string;
  name: string;
  description: string;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  icon: 'quarry' | 'crusher' | 'mill' | 'preheater' | 'kiln' | 'cooler' | 'silo' | 'truck';
  metrics: (data: TelemetryData | null) => { label: string; value: string; status?: 'normal' | 'warning' | 'critical' }[];
}

const hotspots: Hotspot[] = [
  {
    id: 'quarry',
    name: 'Limestone Quarry',
    description: 'Raw limestone extracted via blasting and excavation from open-pit mines. Material is loaded by hydraulic excavators onto dump trucks.',
    xPct: 0, yPct: 0, widthPct: 18, heightPct: 65,
    icon: 'quarry',
    metrics: () => [
      { label: 'Material Feed', value: '320 TPH', status: 'normal' },
      { label: 'Quality Grade', value: 'A+' },
      { label: 'Moisture', value: '3.2%' },
      { label: 'Trucks Active', value: '4/5', status: 'normal' },
    ],
  },
  {
    id: 'crusher',
    name: 'Primary & Secondary Crusher',
    description: 'Jaw crusher reduces large rocks to ~75mm, then impact crusher further reduces to <25mm for raw milling.',
    xPct: 18, yPct: 10, widthPct: 16, heightPct: 55,
    icon: 'crusher',
    metrics: () => [
      { label: 'Throughput', value: '280 TPH', status: 'normal' },
      { label: 'Output Size', value: '< 25mm' },
      { label: 'Power Draw', value: '320 kW', status: 'normal' },
      { label: 'Vibration', value: 'Normal', status: 'normal' },
    ],
  },
  {
    id: 'preheater',
    name: 'Preheater Tower',
    description: '5-stage cyclone preheater uses hot kiln exhaust gases to preheat raw meal to ~800°C before entering the kiln.',
    xPct: 28, yPct: 0, widthPct: 18, heightPct: 58,
    icon: 'preheater',
    metrics: () => [
      { label: 'Stage Temp', value: '~800°C', status: 'normal' },
      { label: 'Cyclone Stages', value: '5' },
      { label: 'Gas Temp Out', value: '320°C' },
      { label: 'Pressure Drop', value: '48 mbar' },
    ],
  },
  {
    id: 'kiln',
    name: 'Rotary Kiln',
    description: 'The heart of cement production — a 60m rotating cylinder where raw meal is heated to 1450°C to form clinker nodules.',
    xPct: 20, yPct: 58, widthPct: 30, heightPct: 28,
    icon: 'kiln',
    metrics: (data) => [
      { label: 'Temperature', value: `${data?.kiln_temp_c?.toFixed(0) || '1450'}°C`, status: (data?.kiln_temp_c || 1450) > 1500 ? 'critical' : (data?.kiln_temp_c || 1450) < 1400 ? 'warning' : 'normal' },
      { label: 'Energy', value: `${data?.energy_per_ton_kwh?.toFixed(1) || '88'} kWh/t` },
      { label: 'Therm. Sub.', value: `${data?.thermal_substitution_rate?.toFixed(1) || '32'}%`, status: (data?.thermal_substitution_rate || 32) < 25 ? 'warning' : 'normal' },
      { label: 'Shell Temp', value: '285°C', status: 'normal' },
    ],
  },
  {
    id: 'rawmill',
    name: 'Raw / Cement Mill',
    description: 'Vertical roller mill grinds raw materials and clinker with gypsum into fine powder.',
    xPct: 50, yPct: 40, widthPct: 18, heightPct: 42,
    icon: 'mill',
    metrics: (data) => [
      { label: 'Power', value: `${data?.mill_power_kw?.toFixed(0) || '1200'} kW`, status: (data?.mill_power_kw || 0) > 1300 ? 'warning' : 'normal' },
      { label: 'Throughput', value: `${data?.mill_throughput_tph?.toFixed(1) || '85'} TPH` },
      { label: 'Sep. Eff.', value: `${((data?.separator_efficiency || 0.85) * 100).toFixed(1)}%`, status: ((data?.separator_efficiency || 0.85) * 100) < 80 ? 'warning' : 'normal' },
      { label: 'Blaine', value: '3800 cm²/g' },
    ],
  },
  {
    id: 'silos',
    name: 'Cement Storage Silos',
    description: 'Multiple large concrete silos store finished cement products before dispatch via bulk tankers.',
    xPct: 68, yPct: 5, widthPct: 18, heightPct: 60,
    icon: 'silo',
    metrics: () => [
      { label: 'Silo 1 (OPC 53)', value: '78%', status: 'normal' },
      { label: 'Silo 2 (OPC 43)', value: '45%' },
      { label: 'Silo 3 (PPC)', value: '62%' },
      { label: 'Daily Output', value: '4200 MT' },
    ],
  },
  {
    id: 'dispatch',
    name: 'Shipping & Dispatch',
    description: 'Cement dispatched via bulk tanker trucks and bag packing lines.',
    xPct: 82, yPct: 55, widthPct: 18, heightPct: 35,
    icon: 'truck',
    metrics: () => [
      { label: 'Daily Dispatch', value: '4200 MT' },
      { label: 'Trucks/Day', value: '140' },
      { label: 'Bag Packing', value: '800 bags/hr' },
      { label: 'Queue', value: '12 trucks' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface CementPlant3DProps {
  latestData: TelemetryData | null;
}

const CementPlant3D = ({ latestData }: CementPlant3DProps) => {
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 1200);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status?: string) => {
    if (status === 'critical') return 'bg-[#EA4335]';
    if (status === 'warning') return 'bg-[#FBBC04]';
    return 'bg-[#34A853]';
  };

  const getStatusBorder = (status?: string) => {
    if (status === 'critical') return 'border-[#EA4335]/50';
    if (status === 'warning') return 'border-[#FBBC04]/50';
    return 'border-[#34A853]/30';
  };

  const isActiveEquipment = (id: string) => ['kiln', 'rawmill', 'preheater', 'crusher'].includes(id);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-foreground">
            Cement Manufacturing Plant — Live View
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Click any equipment for real-time telemetry • Hover to identify
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="text-[10px] text-success font-medium">LIVE</span>
        </div>
      </div>

      {/* 3D Plant Image with Hotspots */}
      <div ref={containerRef} className="flex-1 relative rounded-xl overflow-hidden border border-border shadow-lg min-h-[250px]">
        <img
          src={cementPlantImage}
          alt="3D Cement Manufacturing Plant"
          className="w-full h-full object-cover"
          draggable={false}
          width={1920}
          height={1080}
        />

        {/* Subtle animated scan line for "live" feel */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"
            style={{
              animation: 'scanline 4s linear infinite',
            }}
          />
        </div>

        {/* Hotspot overlays */}
        {hotspots.map((spot) => {
          const isHovered = hoveredId === spot.id;
          const isSelected = selectedHotspot?.id === spot.id;
          const isActive = isActiveEquipment(spot.id);

          return (
            <div
              key={spot.id}
              className="absolute cursor-pointer transition-all duration-300"
              style={{
                left: `${spot.xPct}%`,
                top: `${spot.yPct}%`,
                width: `${spot.widthPct}%`,
                height: `${spot.heightPct}%`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedHotspot(isSelected ? null : spot);
              }}
              onMouseEnter={() => setHoveredId(spot.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Highlight border */}
              <div
                className={`absolute inset-0 rounded-lg border-2 transition-all duration-300 ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(66,133,244,0.3)]'
                    : isHovered
                    ? 'border-primary/50 bg-primary/5 shadow-[0_0_10px_rgba(66,133,244,0.15)]'
                    : 'border-transparent'
                }`}
              />

              {/* Pulsing status indicator for active equipment */}
              {isActive && (
                <div className="absolute -top-1.5 -right-1.5 z-10">
                  <span className={`flex h-3.5 w-3.5 ${pulse ? 'opacity-100' : 'opacity-70'} transition-opacity duration-500`}>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-success border-2 border-background shadow-md" />
                  </span>
                </div>
              )}

              {/* Hover label */}
              {isHovered && !isSelected && (
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-fade-in">
                  <div className="bg-foreground/90 backdrop-blur-sm text-background text-[10px] font-semibold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-success' : 'bg-muted'}`} />
                    {spot.name}
                    <ChevronRight className="h-2.5 w-2.5 opacity-50" />
                  </div>
                  <div className="w-2 h-2 bg-foreground/90 rotate-45 mx-auto -mt-1" />
                </div>
              )}
            </div>
          );
        })}

        {/* Selected equipment detail overlay */}
        {selectedHotspot && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:bottom-3 sm:w-[320px] z-40 animate-fade-in">
            <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
                      {selectedHotspot.id === 'kiln' && <Flame className="h-4 w-4 text-destructive" />}
                      {selectedHotspot.id === 'rawmill' && <Gauge className="h-4 w-4 text-primary" />}
                      {selectedHotspot.id === 'preheater' && <Thermometer className="h-4 w-4 text-warning" />}
                      {selectedHotspot.id === 'crusher' && <Zap className="h-4 w-4 text-primary" />}
                      {selectedHotspot.id === 'silos' && <Wind className="h-4 w-4 text-muted-foreground" />}
                      {!['kiln', 'rawmill', 'preheater', 'crusher', 'silos'].includes(selectedHotspot.id) && (
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground leading-tight">{selectedHotspot.name}</h4>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isActiveEquipment(selectedHotspot.id) ? 'bg-success' : 'bg-muted-foreground'}`} />
                        <span className="text-[9px] text-muted-foreground">
                          {isActiveEquipment(selectedHotspot.id) ? 'Operating' : 'Standby'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedHotspot(null); }}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="px-4 py-2 border-b border-border/50">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {selectedHotspot.description}
                </p>
              </div>

              {/* Metrics grid */}
              <div className="p-3 grid grid-cols-2 gap-2">
                {selectedHotspot.metrics(latestData).map((m, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-lg bg-muted/40 border ${getStatusBorder(m.status)} transition-colors`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${getStatusColor(m.status)}`} />
                      <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{m.label}</p>
                    </div>
                    <p className="text-sm font-bold text-foreground leading-tight">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick-select legend */}
      <div className="flex flex-wrap gap-1.5 mt-2 px-1">
        {hotspots.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedHotspot(selectedHotspot?.id === s.id ? null : s)}
            className={`text-[9px] sm:text-[10px] px-2.5 py-1 rounded-full border font-medium transition-all duration-200 ${
              selectedHotspot?.id === s.id
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Scanline animation */}
      <style>{`
        @keyframes scanline {
          0% { top: -2px; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default CementPlant3D;
