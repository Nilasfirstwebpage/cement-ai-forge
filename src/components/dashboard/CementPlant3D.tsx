import { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, Environment, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';
import { TelemetryData } from '@/types/telemetry';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface StageInfo {
  id: string;
  label: string;
  description: string;
  metrics: (d: TelemetryData | null) => { label: string; value: string; status?: 'normal' | 'warning' | 'critical' }[];
}

const stages: StageInfo[] = [
  {
    id: 'quarry', label: 'Limestone Quarry', description: 'Raw limestone extraction via blasting.',
    metrics: () => [
      { label: 'Material Feed', value: '320 TPH', status: 'normal' },
      { label: 'Moisture', value: '3.2%' },
    ],
  },
  {
    id: 'crusher', label: 'Crusher', description: 'Jaw & impact crushers reduce rock to <25 mm.',
    metrics: () => [
      { label: 'Throughput', value: '280 TPH', status: 'normal' },
      { label: 'Power', value: '320 kW' },
    ],
  },
  {
    id: 'rawmill', label: 'Raw Mill', description: 'Vertical roller mill grinds raw meal.',
    metrics: (d) => [
      { label: 'Power', value: `${d?.mill_power_kw?.toFixed(0) || '1200'} kW`, status: (d?.mill_power_kw || 0) > 1300 ? 'warning' : 'normal' },
      { label: 'Throughput', value: `${d?.mill_throughput_tph?.toFixed(1) || '85'} TPH` },
      { label: 'Sep. Eff.', value: `${((d?.separator_efficiency || 0.85) * 100).toFixed(1)}%` },
    ],
  },
  {
    id: 'preheater', label: 'Preheater Tower', description: '5-stage cyclone preheater, ~800 °C.',
    metrics: () => [
      { label: 'Stage Temp', value: '~800 °C', status: 'normal' },
      { label: 'Stages', value: '5' },
    ],
  },
  {
    id: 'kiln', label: 'Rotary Kiln', description: 'Core of clinker production at 1 450 °C.',
    metrics: (d) => [
      { label: 'Temp', value: `${d?.kiln_temp_c?.toFixed(0) || '1450'} °C`, status: (d?.kiln_temp_c || 1450) > 1500 ? 'critical' : (d?.kiln_temp_c || 1450) < 1400 ? 'warning' : 'normal' },
      { label: 'Energy', value: `${d?.energy_per_ton_kwh?.toFixed(1) || '88'} kWh/t` },
      { label: 'Therm Sub', value: `${d?.thermal_substitution_rate?.toFixed(1) || '32'}%` },
    ],
  },
  {
    id: 'cooler', label: 'Clinker Cooler', description: 'Grate cooler cools clinker to ~100 °C.',
    metrics: (d) => [
      { label: 'Fan RPM', value: `${d?.cooler_fan_rpm?.toFixed(0) || '1250'}` },
      { label: 'Clinker Temp', value: `${d?.clinker_temp_c?.toFixed(0) || '95'} °C` },
    ],
  },
  {
    id: 'cement_mill', label: 'Cement Mill', description: 'Clinker ground with gypsum into cement.',
    metrics: () => [
      { label: 'Blaine', value: '3800 cm²/g' },
      { label: 'Gypsum', value: '4.2%' },
    ],
  },
  {
    id: 'silos', label: 'Cement Silos', description: 'Storage before dispatch.',
    metrics: () => [
      { label: 'Silo 1', value: '78%', status: 'normal' },
      { label: 'Silo 2', value: '45%' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Ground plane                                                       */
/* ------------------------------------------------------------------ */
const Ground = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
    <planeGeometry args={[60, 40]} />
    <meshStandardMaterial color="#7c8a6e" roughness={1} />
  </mesh>
);

/* ------------------------------------------------------------------ */
/*  Conveyor belt with animated particles                             */
/* ------------------------------------------------------------------ */
const ConveyorBelt = ({ start, end, color = '#888' }: { start: [number, number, number]; end: [number, number, number]; color?: string }) => {
  const ref = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const count = 8;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const direction = useMemo(() => {
    const d = new THREE.Vector3(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
    return d;
  }, [start, end]);

  const length = useMemo(() => direction.length(), [direction]);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const frac = ((t * 0.3 + i / count) % 1);
      dummy.position.set(
        start[0] + direction.x * frac,
        start[1] + direction.y * frac + 0.15,
        start[2] + direction.z * frac
      );
      dummy.scale.setScalar(0.12);
      dummy.updateMatrix();
      particlesRef.current.setMatrixAt(i, dummy.matrix);
    }
    particlesRef.current.instanceMatrix.needsUpdate = true;
  });

  // belt structure
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ];

  const angle = Math.atan2(direction.z, direction.x);

  return (
    <group ref={ref}>
      {/* belt rail */}
      <mesh position={midpoint} rotation={[0, -angle, 0]}>
        <boxGeometry args={[length, 0.08, 0.3]} />
        <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* supports */}
      {[0.2, 0.5, 0.8].map((f, i) => (
        <mesh key={i} position={[start[0] + direction.x * f, start[1] + direction.y * f - 0.3, start[2] + direction.z * f]}>
          <boxGeometry args={[0.08, 0.6, 0.08]} />
          <meshStandardMaterial color="#444" metalness={0.8} />
        </mesh>
      ))}
      {/* animated material particles */}
      <instancedMesh ref={particlesRef} args={[undefined, undefined, count]} castShadow>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </instancedMesh>
    </group>
  );
};

/* ------------------------------------------------------------------ */
/*  Equipment components                                               */
/* ------------------------------------------------------------------ */

const Quarry = ({ onClick, active }: { onClick: () => void; active: boolean }) => (
  <group position={[12, 0, 8]} onClick={onClick}>
    {/* Quarry pit */}
    <mesh position={[0, 0.3, 0]} castShadow>
      <coneGeometry args={[3, 1.5, 6]} />
      <meshStandardMaterial color="#c4a35a" roughness={1} />
    </mesh>
    {/* Rocks */}
    {[[-1, 0.8, 0.5], [0.5, 1, -0.3], [1.2, 0.6, 0.8]].map((p, i) => (
      <mesh key={i} position={p as [number, number, number]} castShadow>
        <dodecahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color="#a89060" roughness={1} />
      </mesh>
    ))}
    {active && <pointLight position={[0, 2, 0]} color="#4285F4" intensity={3} distance={5} />}
  </group>
);

const CrusherUnit = ({ onClick, active }: { onClick: () => void; active: boolean }) => (
  <group position={[7, 0, 6]} onClick={onClick}>
    {/* Main body */}
    <mesh position={[0, 1.2, 0]} castShadow>
      <boxGeometry args={[2.5, 2.4, 2]} />
      <meshStandardMaterial color="#5a6a7a" metalness={0.7} roughness={0.3} />
    </mesh>
    {/* Hopper top */}
    <mesh position={[0, 2.8, 0]} castShadow>
      <cylinderGeometry args={[1.5, 1, 0.8, 4]} />
      <meshStandardMaterial color="#6a7a8a" metalness={0.6} roughness={0.4} />
    </mesh>
    {/* output chute */}
    <mesh position={[0, 0.3, 1.2]} rotation={[0.3, 0, 0]} castShadow>
      <boxGeometry args={[0.6, 0.15, 1]} />
      <meshStandardMaterial color="#555" metalness={0.7} />
    </mesh>
    {active && <pointLight position={[0, 3, 0]} color="#4285F4" intensity={3} distance={5} />}
  </group>
);

const RawMill = ({ onClick, active }: { onClick: () => void; active: boolean }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * 0.5;
  });
  return (
    <group position={[2, 0, 4]} onClick={onClick}>
      {/* Roller mill body */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.4, 2.5, 16]} />
        <meshStandardMaterial color="#7a8a9a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Rotating separator top */}
      <mesh ref={ref} position={[0, 3.2, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.6, 8]} />
        <meshStandardMaterial color="#6688aa" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Motor */}
      <mesh position={[1.6, 0.8, 0]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.6]} />
        <meshStandardMaterial color="#3366aa" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Outlet pipe */}
      <mesh position={[-0.5, 3.8, 0]} rotation={[0, 0, 0.4]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 1.5, 8]} />
        <meshStandardMaterial color="#999" metalness={0.6} />
      </mesh>
      {active && <pointLight position={[0, 4, 0]} color="#4285F4" intensity={3} distance={5} />}
    </group>
  );
};

const PreheaterTower = ({ onClick, active }: { onClick: () => void; active: boolean }) => (
  <group position={[-3, 0, 2]} onClick={onClick}>
    {/* Tower structure */}
    {[0, 1, 2, 3, 4].map((i) => (
      <group key={i}>
        {/* Support columns */}
        <mesh position={[-0.6, i * 1.8 + 0.9, -0.6]} castShadow>
          <boxGeometry args={[0.15, 1.8, 0.15]} />
          <meshStandardMaterial color="#889" metalness={0.7} />
        </mesh>
        <mesh position={[0.6, i * 1.8 + 0.9, -0.6]} castShadow>
          <boxGeometry args={[0.15, 1.8, 0.15]} />
          <meshStandardMaterial color="#889" metalness={0.7} />
        </mesh>
        <mesh position={[-0.6, i * 1.8 + 0.9, 0.6]} castShadow>
          <boxGeometry args={[0.15, 1.8, 0.15]} />
          <meshStandardMaterial color="#889" metalness={0.7} />
        </mesh>
        <mesh position={[0.6, i * 1.8 + 0.9, 0.6]} castShadow>
          <boxGeometry args={[0.15, 1.8, 0.15]} />
          <meshStandardMaterial color="#889" metalness={0.7} />
        </mesh>
        {/* Cyclone at each stage */}
        <mesh position={[0, i * 1.8 + 1.2, 0]} castShadow>
          <coneGeometry args={[0.5, 0.8, 8]} />
          <meshStandardMaterial color="#aab" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Platform */}
        <mesh position={[0, i * 1.8 + 0.05, 0]}>
          <boxGeometry args={[1.8, 0.06, 1.8]} />
          <meshStandardMaterial color="#667" metalness={0.8} />
        </mesh>
      </group>
    ))}
    {/* Top duct */}
    <mesh position={[0, 9.5, 0]} castShadow>
      <cylinderGeometry args={[0.3, 0.3, 1, 8]} />
      <meshStandardMaterial color="#bbb" metalness={0.6} />
    </mesh>
    {active && <pointLight position={[0, 10, 0]} color="#4285F4" intensity={4} distance={6} />}
  </group>
);

const RotaryKiln = ({ onClick, active }: { onClick: () => void; active: boolean }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.x = state.clock.elapsedTime * 0.3;
  });
  return (
    <group position={[-6, 0, -2]} onClick={onClick}>
      {/* Kiln tube — tilted */}
      <mesh ref={ref} position={[0, 1.5, 0]} rotation={[0, 0, 0.05]} castShadow>
        <cylinderGeometry args={[0.9, 0.9, 8, 16, 1, true]} />
        <meshStandardMaterial color="#8b4513" metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* End caps */}
      <mesh position={[-0.2, 1.5, 0]} rotation={[0, 0, 0.05]}>
        <cylinderGeometry args={[0.92, 0.92, 0.1, 16]} />
        <meshStandardMaterial color="#666" metalness={0.8} />
      </mesh>
      {/* Support rings */}
      {[-2.5, 0, 2.5].map((y, i) => (
        <mesh key={i} position={[y * 0.05, 1.5 + y * 0.015, 0]} rotation={[0, 0, 0.05]}>
          <torusGeometry args={[1, 0.08, 8, 16]} />
          <meshStandardMaterial color="#777" metalness={0.9} />
        </mesh>
      ))}
      {/* Support rollers */}
      {[-2, 0, 2].map((x, i) => (
        <group key={i} position={[x * 0.6, 0.3, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.6, 1.2]} />
            <meshStandardMaterial color="#555" metalness={0.7} />
          </mesh>
        </group>
      ))}
      {/* Flame glow */}
      <pointLight position={[3, 1.5, 0]} color="#ff6600" intensity={8} distance={6} />
      <pointLight position={[2.5, 1.5, 0]} color="#ff3300" intensity={4} distance={4} />
      {active && <pointLight position={[0, 3, 0]} color="#4285F4" intensity={4} distance={6} />}
    </group>
  );
};

const ClinkerCooler = ({ onClick, active }: { onClick: () => void; active: boolean }) => (
  <group position={[-10, 0, -4]} onClick={onClick}>
    <mesh position={[0, 0.8, 0]} castShadow>
      <boxGeometry args={[3, 1.5, 2]} />
      <meshStandardMaterial color="#6a7a8a" metalness={0.6} roughness={0.4} />
    </mesh>
    {/* Fans */}
    {[-0.8, 0, 0.8].map((x, i) => (
      <mesh key={i} position={[x, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.3, 8]} />
        <meshStandardMaterial color="#4a8aaa" metalness={0.8} />
      </mesh>
    ))}
    {/* Grate lines */}
    {[-0.6, -0.2, 0.2, 0.6].map((z, i) => (
      <mesh key={i} position={[0, 0.05, z]}>
        <boxGeometry args={[2.8, 0.03, 0.05]} />
        <meshStandardMaterial color="#444" metalness={0.9} />
      </mesh>
    ))}
    {active && <pointLight position={[0, 2.5, 0]} color="#4285F4" intensity={3} distance={5} />}
  </group>
);

const CementMill = ({ onClick, active }: { onClick: () => void; active: boolean }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * 0.6;
  });
  return (
    <group position={[-6, 0, -8]} onClick={onClick}>
      {/* Horizontal drum */}
      <mesh ref={ref} position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 3.5, 16]} />
        <meshStandardMaterial color="#7a8a6a" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Drive motor */}
      <mesh position={[1.2, 0.8, -2]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#3366aa" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Bearing supports */}
      {[-1.5, 1.5].map((z, i) => (
        <mesh key={i} position={[0, 0.4, z]} castShadow>
          <boxGeometry args={[1.2, 0.8, 0.4]} />
          <meshStandardMaterial color="#555" metalness={0.7} />
        </mesh>
      ))}
      {active && <pointLight position={[0, 2.5, 0]} color="#4285F4" intensity={3} distance={5} />}
    </group>
  );
};

const StorageSilos = ({ onClick, active }: { onClick: () => void; active: boolean }) => (
  <group position={[-1, 0, -10]} onClick={onClick}>
    {[0, 2.2, 4.4].map((x, i) => (
      <group key={i} position={[x, 0, 0]}>
        <mesh position={[0, 3, 0]} castShadow>
          <cylinderGeometry args={[0.9, 0.9, 6, 16]} />
          <meshStandardMaterial color="#bbb" metalness={0.3} roughness={0.6} />
        </mesh>
        {/* Cone top */}
        <mesh position={[0, 6.3, 0]} castShadow>
          <coneGeometry args={[0.9, 0.8, 16]} />
          <meshStandardMaterial color="#ccc" metalness={0.4} />
        </mesh>
        {/* Band details */}
        {[1.5, 3, 4.5].map((y, j) => (
          <mesh key={j} position={[0, y, 0]}>
            <torusGeometry args={[0.92, 0.04, 8, 16]} />
            <meshStandardMaterial color="#999" metalness={0.8} />
          </mesh>
        ))}
      </group>
    ))}
    {active && <pointLight position={[2, 7, 0]} color="#4285F4" intensity={4} distance={7} />}
  </group>
);

/* ------------------------------------------------------------------ */
/*  Truck with simple animation                                        */
/* ------------------------------------------------------------------ */
const DumpTruck = () => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      const loop = (t * 0.4) % 1;
      // Move from quarry toward crusher
      ref.current.position.x = 12 - loop * 6;
      ref.current.position.z = 8 - loop * 2.5;
    }
  });
  return (
    <group ref={ref}>
      {/* Cab */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.8, 0.7, 0.6]} />
        <meshStandardMaterial color="#e8c840" roughness={0.5} />
      </mesh>
      {/* Bed */}
      <mesh position={[-0.7, 0.5, 0]} castShadow>
        <boxGeometry args={[1.2, 0.5, 0.7]} />
        <meshStandardMaterial color="#e8c840" roughness={0.5} />
      </mesh>
      {/* Wheels */}
      {[[0.3, 0.15, 0.35], [0.3, 0.15, -0.35], [-0.9, 0.15, 0.35], [-0.9, 0.15, -0.35]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
    </group>
  );
};

/* ------------------------------------------------------------------ */
/*  Smoke / Steam particles                                            */
/* ------------------------------------------------------------------ */
const SmokeParticles = ({ position }: { position: [number, number, number] }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = 20;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const life = (t * 0.3 + i * 0.15) % 3;
      dummy.position.set(
        position[0] + Math.sin(i * 2.3 + t * 0.5) * 0.3,
        position[1] + life * 2,
        position[2] + Math.cos(i * 1.7 + t * 0.3) * 0.3
      );
      const s = 0.1 + life * 0.15;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.2, 6, 6]} />
      <meshStandardMaterial color="#ddd" transparent opacity={0.3} />
    </instancedMesh>
  );
};

/* ------------------------------------------------------------------ */
/*  Flow arrows (green animated arrows like reference images)          */
/* ------------------------------------------------------------------ */
const FlowArrow = ({ points }: { points: [number, number, number][] }) => {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current && ref.current.material instanceof THREE.MeshStandardMaterial) {
      ref.current.material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
    }
  });

  if (points.length < 2) return null;

  return (
    <group>
      {points.slice(0, -1).map((p, i) => {
        const next = points[i + 1];
        const mid: [number, number, number] = [(p[0] + next[0]) / 2, (p[1] + next[1]) / 2, (p[2] + next[2]) / 2];
        const dx = next[0] - p[0];
        const dz = next[2] - p[2];
        const len = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);
        return (
          <mesh key={i} ref={i === 0 ? ref : undefined} position={mid} rotation={[0, -angle, 0]}>
            <boxGeometry args={[len, 0.08, 0.15]} />
            <meshStandardMaterial color="#34A853" emissive="#34A853" emissiveIntensity={0.5} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ------------------------------------------------------------------ */
/*  Label floating above equipment                                     */
/* ------------------------------------------------------------------ */
const EquipmentLabel = ({ position, text, active }: { position: [number, number, number]; text: string; active: boolean }) => (
  <Float speed={2} floatIntensity={0.3}>
    <Text
      position={position}
      fontSize={0.35}
      color={active ? '#4285F4' : '#ffffff'}
      anchorX="center"
      anchorY="bottom"
      outlineWidth={0.03}
      outlineColor="#000000"
      font="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf"
    >
      {text}
    </Text>
  </Float>
);

/* ------------------------------------------------------------------ */
/*  Info popup (Html overlay)                                          */
/* ------------------------------------------------------------------ */
const InfoPopup = ({ stage, data, onClose }: { stage: StageInfo; data: TelemetryData | null; onClose: () => void }) => {
  const metrics = stage.metrics(data);
  const getStatusColor = (s?: string) => s === 'critical' ? '#EA4335' : s === 'warning' ? '#FBBC04' : '#34A853';

  return (
    <div
      className="bg-card/95 backdrop-blur-md border border-border rounded-xl p-3 min-w-[200px] max-w-[260px] shadow-2xl"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-foreground">{stage.label}</h4>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
      </div>
      <p className="text-[10px] text-muted-foreground mb-2 leading-relaxed">{stage.description}</p>
      <div className="space-y-1">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center justify-between py-0.5 border-b border-border/50 last:border-0">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: getStatusColor(m.status) }} />
              {m.label}
            </span>
            <span className="text-xs font-bold text-foreground">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main scene                                                         */
/* ------------------------------------------------------------------ */
const Scene = ({ latestData, selectedId, onSelect }: { latestData: TelemetryData | null; selectedId: string | null; onSelect: (id: string | null) => void }) => {
  const toggle = useCallback((id: string) => onSelect(selectedId === id ? null : id), [selectedId, onSelect]);
  const selectedStage = stages.find(s => s.id === selectedId) || null;

  // Equipment label positions
  const labelPositions: Record<string, [number, number, number]> = {
    quarry: [12, 3, 8],
    crusher: [7, 4, 6],
    rawmill: [2, 5, 4],
    preheater: [-3, 11, 2],
    kiln: [-6, 4, -2],
    cooler: [-10, 3, -4],
    cement_mill: [-6, 3.5, -8],
    silos: [-1, 8, -10],
  };

  // Popup positions (Html)
  const popupPositions: Record<string, [number, number, number]> = {
    quarry: [12, 3.5, 8],
    crusher: [7, 4.5, 6],
    rawmill: [2, 5.5, 4],
    preheater: [-3, 11.5, 2],
    kiln: [-6, 4.5, -2],
    cooler: [-10, 3.5, -4],
    cement_mill: [-6, 4, -8],
    silos: [-1, 8.5, -10],
  };

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[15, 20, 10]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-10, 15, -5]} intensity={0.4} />

      <Ground />
      <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={60} blur={2} />

      {/* Equipment */}
      <Quarry onClick={() => toggle('quarry')} active={selectedId === 'quarry'} />
      <CrusherUnit onClick={() => toggle('crusher')} active={selectedId === 'crusher'} />
      <RawMill onClick={() => toggle('rawmill')} active={selectedId === 'rawmill'} />
      <PreheaterTower onClick={() => toggle('preheater')} active={selectedId === 'preheater'} />
      <RotaryKiln onClick={() => toggle('kiln')} active={selectedId === 'kiln'} />
      <ClinkerCooler onClick={() => toggle('cooler')} active={selectedId === 'cooler'} />
      <CementMill onClick={() => toggle('cement_mill')} active={selectedId === 'cement_mill'} />
      <StorageSilos onClick={() => toggle('silos')} active={selectedId === 'silos'} />

      {/* Animated truck */}
      <DumpTruck />

      {/* Conveyor belts */}
      <ConveyorBelt start={[12, 0.5, 8]} end={[7, 1, 6]} color="#c4a35a" />
      <ConveyorBelt start={[7, 0.5, 6]} end={[2, 0.8, 4]} color="#aaa" />
      <ConveyorBelt start={[2, 0.8, 4]} end={[-3, 0.5, 2]} color="#bbb" />
      <ConveyorBelt start={[-3, 0.5, 2]} end={[-6, 0.5, -2]} color="#bbb" />
      <ConveyorBelt start={[-6, 0.5, -2]} end={[-10, 0.5, -4]} color="#c55" />
      <ConveyorBelt start={[-10, 0.5, -4]} end={[-6, 0.5, -8]} color="#aaa" />
      <ConveyorBelt start={[-6, 0.5, -8]} end={[-1, 0.5, -10]} color="#ccc" />

      {/* Flow arrows */}
      <FlowArrow points={[[12, 0.3, 8], [7, 0.3, 6], [2, 0.3, 4]]} />
      <FlowArrow points={[[2, 0.3, 4], [-3, 0.3, 2], [-6, 0.3, -2]]} />
      <FlowArrow points={[[-6, 0.3, -2], [-10, 0.3, -4], [-6, 0.3, -8], [-1, 0.3, -10]]} />

      {/* Smoke from kiln & preheater */}
      <SmokeParticles position={[-6, 3, -2]} />
      <SmokeParticles position={[-3, 10, 2]} />

      {/* Floating labels */}
      {stages.map(s => (
        <EquipmentLabel key={s.id} position={labelPositions[s.id]} text={s.label} active={selectedId === s.id} />
      ))}

      {/* Info popup */}
      {selectedStage && popupPositions[selectedStage.id] && (
        <Html position={popupPositions[selectedStage.id]} center distanceFactor={15} zIndexRange={[100, 0]}>
          <InfoPopup stage={selectedStage} data={latestData} onClose={() => onSelect(null)} />
        </Html>
      )}

      <OrbitControls
        makeDefault
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={8}
        maxDistance={40}
        target={[0, 2, 0]}
      />
    </>
  );
};

/* ------------------------------------------------------------------ */
/*  Exported wrapper                                                   */
/* ------------------------------------------------------------------ */
interface CementPlant3DProps {
  latestData: TelemetryData | null;
}

const CementPlant3D = ({ latestData }: CementPlant3DProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-2 px-1">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-foreground">
            3D Cement Manufacturing Plant
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Orbit: drag • Zoom: scroll • Click equipment for live metrics
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
      <div className="flex-1 rounded-lg overflow-hidden border border-border bg-gradient-to-b from-[hsl(210,30%,85%)] to-[hsl(210,25%,70%)] dark:from-[hsl(210,20%,20%)] dark:to-[hsl(210,15%,10%)] min-h-[300px]">
        <Canvas
          shadows
          camera={{ position: [20, 15, 20], fov: 45 }}
          gl={{ antialias: true, alpha: false }}
          style={{ width: '100%', height: '100%' }}
        >
          <fog attach="fog" args={['#b8c8d8', 30, 60]} />
          <Scene latestData={latestData} selectedId={selectedId} onSelect={setSelectedId} />
        </Canvas>
      </div>
      {/* Navigation legend */}
      <div className="flex flex-wrap gap-1 mt-2 px-1">
        {stages.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}
            className={`text-[9px] sm:text-[10px] px-2 py-1 rounded-full border transition-all ${
              selectedId === s.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CementPlant3D;
