export interface TelemetryData {
  id?: string;
  timestamp: string;
  mill_power_kw: number;
  mill_throughput_tph: number;
  separator_efficiency: number;
  kiln_temp_c: number;
  cooler_fan_rpm?: number;
  raw_caO?: number;
  raw_siO2?: number;
  raw_al2O3?: number;
  raw_fe2O3?: number;
  raw_moisture?: number;
  clinker_temp_c?: number;
  fuel_mix?: any[];
  energy_per_ton_kwh: number;
  thermal_substitution_rate: number;
  time?: string;
  createdAt?: any;
  recommendations?: string;
}
