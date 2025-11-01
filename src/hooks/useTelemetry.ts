import { useState, useEffect } from 'react';

interface TelemetryData {
  timestamp: string;
  mill_power_kw: number;
  mill_throughput_tph: number;
  separator_efficiency: number;
  kiln_temp_c: number;
  cooler_fan_rpm: number;
  raw_caO: number;
  raw_siO2: number;
  raw_al2O3: number;
  raw_fe2O3: number;
  raw_moisture: number;
  clinker_temp_c: number;
  fuel_mix: string;
  energy_per_ton_kwh: number;
  thermal_substitution_rate: number;
  time?: string;
}

interface Trends {
  energy: number;
  power: number;
  kiln_temp: number;
  throughput: number;
  thermal_sub: number;
  separator: number;
}

export const useTelemetry = () => {
  const [latestData, setLatestData] = useState<TelemetryData | null>(null);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [history, setHistory] = useState<TelemetryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate realistic synthetic telemetry for demo
    const generateSyntheticData = (): TelemetryData => {
      const baseEnergy = 94 + Math.random() * 8; // 94-102 kWh/ton
      const basePower = 1200 + Math.random() * 150; // 1200-1350 kW
      const baseThroughput = 80 + Math.random() * 10; // 80-90 TPH
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      return {
        timestamp: new Date().toISOString(),
        mill_power_kw: basePower,
        mill_throughput_tph: baseThroughput,
        separator_efficiency: 0.82 + Math.random() * 0.08,
        kiln_temp_c: 1395 + Math.random() * 30,
        cooler_fan_rpm: 820 + Math.random() * 60,
        raw_caO: 61.5 + Math.random() * 2,
        raw_siO2: 20.5 + Math.random() * 1,
        raw_al2O3: 5.2 + Math.random() * 0.6,
        raw_fe2O3: 3.0 + Math.random() * 0.4,
        raw_moisture: 1.8 + Math.random() * 0.5,
        clinker_temp_c: 1130 + Math.random() * 40,
        fuel_mix: JSON.stringify([
          { fuel: 'coal', '%': 52 + Math.random() * 6 },
          { fuel: 'biomass', '%': 24 + Math.random() * 4 },
          { fuel: 'petcoke', '%': 18 + Math.random() * 4 }
        ]),
        energy_per_ton_kwh: baseEnergy,
        thermal_substitution_rate: 24 + Math.random() * 8,
        time: timeStr
      };
    };

    const generateTrends = (): Trends => ({
      energy: -2.1 + Math.random() * 4.2, // -2.1% to +2.1%
      power: -1.5 + Math.random() * 3,
      kiln_temp: -0.8 + Math.random() * 1.6,
      throughput: -1.0 + Math.random() * 2.0,
      thermal_sub: -0.5 + Math.random() * 1.0,
      separator: -0.3 + Math.random() * 0.6
    });

    // Initial load
    const initialData = generateSyntheticData();
    setLatestData(initialData);
    setHistory([initialData]);
    setTrends(generateTrends());
    setLoading(false);

    // Update telemetry every 5 seconds (simulating real-time updates)
    const interval = setInterval(() => {
      const newData = generateSyntheticData();
      setLatestData(newData);
      setHistory(prev => {
        const updated = [...prev, newData];
        return updated.slice(-20); // Keep last 20 data points
      });
      setTrends(generateTrends());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { latestData, trends, loading, history };
};
