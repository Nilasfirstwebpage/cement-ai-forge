import { useState, useEffect, useRef } from 'react';
import { TelemetryData } from '@/types/telemetry';
import { X, ChevronRight, Flame, Thermometer, Zap, Wind, Gauge, Play, Volume2, VolumeX } from 'lucide-react';

import overviewVideo from '@/assets/videos/cement-overview.mp4.asset.json';
import quarryVideo from '@/assets/videos/quarry.mp4.asset.json';
import crusherVideo from '@/assets/videos/crusher.mp4.asset.json';
import preheaterVideo from '@/assets/videos/preheater.mp4.asset.json';
import kilnVideo from '@/assets/videos/kiln.mp4.asset.json';
import rawmillVideo from '@/assets/videos/rawmill.mp4.asset.json';
import silosVideo from '@/assets/videos/silos.mp4.asset.json';
import dispatchVideo from '@/assets/videos/dispatch.mp4.asset.json';

interface ProcessInfo {
  id: string;
  name: string;
  description: string;
  videoUrl: string;
  icon: 'quarry' | 'crusher' | 'mill' | 'preheater' | 'kiln' | 'cooler' | 'silo' | 'truck';
  step: number;
  metrics: (data: TelemetryData | null) => { label: string; value: string; status?: 'normal' | 'warning' | 'critical' }[];
}

const processes: ProcessInfo[] = [
  {
    id: 'quarry',
    name: 'Limestone Quarry',
    description: 'Raw limestone is extracted via controlled blasting and excavation from open-pit mines. Hydraulic excavators load the material onto 50-ton dump trucks for transport to the primary crusher. Quality is monitored through regular sampling to ensure consistent calcium carbonate content.',
    videoUrl: quarryVideo.url,
    icon: 'quarry',
    step: 1,
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
    description: 'The jaw crusher reduces large rocks from ~1m to ~75mm. A secondary impact crusher further reduces material to <25mm. The crushed limestone is then conveyed to the raw material storage via belt conveyors with metal detectors and weighing systems.',
    videoUrl: crusherVideo.url,
    icon: 'crusher',
    step: 2,
    metrics: () => [
      { label: 'Throughput', value: '280 TPH', status: 'normal' },
      { label: 'Output Size', value: '< 25mm' },
      { label: 'Power Draw', value: '320 kW', status: 'normal' },
      { label: 'Vibration', value: 'Normal', status: 'normal' },
    ],
  },
  {
    id: 'rawmill',
    name: 'Raw / Cement Mill',
    description: 'Vertical roller mill grinds a precise blend of limestone, clay, iron ore, and corrective materials to a fine powder (raw meal). The separator ensures particle size distribution meets specifications. The raw meal is then homogenized in blending silos.',
    videoUrl: rawmillVideo.url,
    icon: 'mill',
    step: 3,
    metrics: (data) => [
      { label: 'Power', value: `${data?.mill_power_kw?.toFixed(0) || '1200'} kW`, status: (data?.mill_power_kw || 0) > 1300 ? 'warning' : 'normal' },
      { label: 'Throughput', value: `${data?.mill_throughput_tph?.toFixed(1) || '85'} TPH` },
      { label: 'Sep. Eff.', value: `${((data?.separator_efficiency || 0.85) * 100).toFixed(1)}%`, status: ((data?.separator_efficiency || 0.85) * 100) < 80 ? 'warning' : 'normal' },
      { label: 'Blaine', value: '3800 cm²/g' },
    ],
  },
  {
    id: 'preheater',
    name: 'Preheater Tower',
    description: 'A 5-stage cyclone preheater tower uses hot exhaust gases from the kiln to progressively heat the raw meal to ~800°C. Each stage separates the material using cyclone action. A calciner at the base provides additional heat for partial decarbonation before the kiln.',
    videoUrl: preheaterVideo.url,
    icon: 'preheater',
    step: 4,
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
    description: 'The heart of cement production — a 60m long, 4.5m diameter rotating cylinder inclined at 3.5°. Raw meal is heated to 1450°C to form clinker nodules through sintering. The flame reaches 2000°C using coal, petcoke, and alternative fuels. Refractory lining protects the steel shell.',
    videoUrl: kilnVideo.url,
    icon: 'kiln',
    step: 5,
    metrics: (data) => [
      { label: 'Temperature', value: `${data?.kiln_temp_c?.toFixed(0) || '1450'}°C`, status: (data?.kiln_temp_c || 1450) > 1500 ? 'critical' : (data?.kiln_temp_c || 1450) < 1400 ? 'warning' : 'normal' },
      { label: 'Energy', value: `${data?.energy_per_ton_kwh?.toFixed(1) || '88'} kWh/t` },
      { label: 'Therm. Sub.', value: `${data?.thermal_substitution_rate?.toFixed(1) || '32'}%`, status: (data?.thermal_substitution_rate || 32) < 25 ? 'warning' : 'normal' },
      { label: 'Shell Temp', value: '285°C', status: 'normal' },
    ],
  },
  {
    id: 'silos',
    name: 'Cement Storage Silos',
    description: 'Finished cement is pneumatically conveyed to large concrete silos (10,000 MT each). Multiple silos store different cement grades — OPC 53, OPC 43, PPC. Aeration systems prevent material bridging. Level monitoring ensures continuous availability for dispatch.',
    videoUrl: silosVideo.url,
    icon: 'silo',
    step: 6,
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
    description: 'Cement is dispatched via automated bulk tanker loading and high-speed bag packing lines (800 bags/hr). Weigh bridges verify truck loads. GPS-tracked fleet management ensures efficient logistics. Both road and rail dispatch options available.',
    videoUrl: dispatchVideo.url,
    icon: 'truck',
    step: 7,
    metrics: () => [
      { label: 'Daily Dispatch', value: '4200 MT' },
      { label: 'Trucks/Day', value: '140' },
      { label: 'Bag Packing', value: '800 bags/hr' },
      { label: 'Queue', value: '12 trucks' },
    ],
  },
];

interface CementPlant3DProps {
  latestData: TelemetryData | null;
}

const CementPlant3D = ({ latestData }: CementPlant3DProps) => {
  const [selectedProcess, setSelectedProcess] = useState<ProcessInfo | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [pulse, setPulse] = useState(false);

  const currentVideo = selectedProcess?.videoUrl || overviewVideo.url;

  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 1200);
    return () => clearInterval(interval);
  }, []);

  const handleProcessClick = (process: ProcessInfo) => {
    if (selectedProcess?.id === process.id) {
      // Deselect
      setIsTransitioning(true);
      setTimeout(() => {
        setSelectedProcess(null);
        setIsTransitioning(false);
      }, 300);
      return;
    }
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedProcess(process);
      setIsTransitioning(false);
    }, 300);
  };

  // When video source changes, play the new video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentVideo]);

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

  const getProcessIcon = (process: ProcessInfo) => {
    switch (process.id) {
      case 'kiln': return <Flame className="h-3.5 w-3.5 text-destructive" />;
      case 'rawmill': return <Gauge className="h-3.5 w-3.5 text-primary" />;
      case 'preheater': return <Thermometer className="h-3.5 w-3.5 text-warning" />;
      case 'crusher': return <Zap className="h-3.5 w-3.5 text-primary" />;
      case 'silos': return <Wind className="h-3.5 w-3.5 text-muted-foreground" />;
      default: return <Gauge className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-foreground">
            {selectedProcess ? selectedProcess.name : 'Cement Manufacturing Plant — Live View'}
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {selectedProcess
              ? `Step ${selectedProcess.step} of 7 — Click another process or deselect to return`
              : 'Select a process stage below to view live footage & telemetry'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedProcess && (
            <button
              onClick={() => handleProcessClick(selectedProcess)}
              className="text-[10px] px-2 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Overview
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            <span className="text-[10px] text-success font-medium">LIVE</span>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="flex-1 relative rounded-xl overflow-hidden border border-border shadow-lg min-h-[250px]">
        {/* Video element */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
          autoPlay
          loop
          muted
          playsInline
          key={currentVideo}
        >
          <source src={currentVideo} type="video/mp4" />
        </video>

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Animated scan line */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            style={{ animation: 'scanline 4s linear infinite' }}
          />
        </div>

        {/* Process step badge (when selected) */}
        {selectedProcess && (
          <div className="absolute top-3 left-3 z-20 animate-fade-in">
            <div className="bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
              {getProcessIcon(selectedProcess)}
              Step {selectedProcess.step}: {selectedProcess.name}
            </div>
          </div>
        )}

        {/* Selected process detail overlay */}
        {selectedProcess && !isTransitioning && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-[360px] z-30 animate-fade-in">
            <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden">
              {/* Description */}
              <div className="px-4 py-3 border-b border-border/50">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {selectedProcess.description}
                </p>
              </div>

              {/* Metrics grid */}
              <div className="p-3 grid grid-cols-2 gap-2">
                {selectedProcess.metrics(latestData).map((m, i) => (
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

      {/* Process selection strip */}
      <div className="mt-2 px-1">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {processes.map((p) => {
            const isSelected = selectedProcess?.id === p.id;
            const isActive = isActiveEquipment(p.id);
            return (
              <button
                key={p.id}
                onClick={() => handleProcessClick(p)}
                className={`flex-shrink-0 flex items-center gap-1.5 text-[9px] sm:text-[10px] px-3 py-1.5 rounded-lg border font-medium transition-all duration-200 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                  isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {p.step}
                </span>
                <span className="whitespace-nowrap">{p.name}</span>
                {isActive && !isSelected && (
                  <span className={`w-1.5 h-1.5 rounded-full bg-success ${pulse ? 'opacity-100' : 'opacity-50'} transition-opacity`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes scanline {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default CementPlant3D;
