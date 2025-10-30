#!/usr/bin/env python3
"""
Synthetic Cement Plant Telemetry Data Generator

Generates realistic minute-resolution operational data for cement manufacturing:
- Raw material chemistry (CaO, SiO2, Al2O3, Fe2O3)
- Grinding mill metrics (power, throughput, separator efficiency)
- Kiln operations (temperature profile, fuel mix)
- Cooler performance (fan RPM, clinker temp)
- Lab quality results (compressive strength, fineness)

Usage:
    python generate_synthetic_data.py --hours 48 --output telemetry.csv
    python generate_synthetic_data.py --hours 24 --fault_type fuel_quality_drop --fault_start_hour 12
"""

import argparse
import csv
import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import numpy as np


class CementPlantSimulator:
    """Simulates realistic cement plant telemetry with optional fault injection."""
    
    def __init__(self, variability: str = 'medium', seed: Optional[int] = None):
        """
        Args:
            variability: 'low', 'medium', or 'high' - controls noise levels
            seed: Random seed for reproducibility
        """
        if seed:
            random.seed(seed)
            np.random.seed(seed)
        
        # Variability multipliers
        self.var_scale = {
            'low': 0.5,
            'medium': 1.0,
            'high': 2.0
        }[variability]
        
        # Normal operating parameters (baseline)
        self.baselines = {
            'mill_power_kw': 1250,
            'mill_throughput_tph': 85,
            'separator_efficiency': 0.85,
            'kiln_temp_c': 1410,
            'cooler_fan_rpm': 850,
            'raw_caO': 62.5,
            'raw_siO2': 21.0,
            'raw_al2O3': 5.5,
            'raw_fe2O3': 3.2,
            'raw_moisture': 2.0,
            'clinker_temp_c': 1150,
            'coal_pct': 55,
            'biomass_pct': 25,
            'petcoke_pct': 20,
            'compressive_strength_mpa': 52.0,
            'blaine_fineness_m2kg': 340
        }
        
        # Variability ranges (std dev as % of baseline)
        self.noise_pct = {
            'mill_power_kw': 3.0 * self.var_scale,
            'mill_throughput_tph': 2.5 * self.var_scale,
            'separator_efficiency': 1.5 * self.var_scale,
            'kiln_temp_c': 1.0 * self.var_scale,
            'cooler_fan_rpm': 2.0 * self.var_scale,
            'raw_caO': 1.5 * self.var_scale,
            'raw_siO2': 2.0 * self.var_scale,
            'raw_al2O3': 3.0 * self.var_scale,
            'raw_fe2O3': 3.5 * self.var_scale,
            'raw_moisture': 15.0 * self.var_scale,
            'clinker_temp_c': 2.0 * self.var_scale,
            'compressive_strength_mpa': 4.0 * self.var_scale,
            'blaine_fineness_m2kg': 2.5 * self.var_scale
        }
        
        # Fault injection state
        self.fault_active = False
        self.fault_params = {}
    
    def inject_fault(self, fault_type: str, start_hour: int, duration_hours: int = 12):
        """Configure fault injection parameters."""
        faults = {
            'raw_variability_spike': {
                'raw_caO': -4.0,  # Drop by 4 percentage points
                'raw_siO2': +2.0,
                'raw_al2O3': +1.0,
                'raw_moisture': +0.8
            },
            'fuel_quality_drop': {
                'biomass_pct': -10,  # Reduce biomass usage
                'coal_pct': +10,  # Compensate with coal
                'kiln_temp_c': -15  # Lower burn temp due to quality
            },
            'mill_vibration': {
                'mill_power_kw': +150,  # Higher power due to inefficiency
                'separator_efficiency': -0.08,
                'mill_throughput_tph': -10
            },
            'cooler_fan_failure': {
                'cooler_fan_rpm': -300,
                'clinker_temp_c': +80,
                'kiln_temp_c': +20
            }
        }
        
        self.fault_params = {
            'type': fault_type,
            'start_hour': start_hour,
            'end_hour': start_hour + duration_hours,
            'modifications': faults.get(fault_type, {})
        }
    
    def _add_noise(self, value: float, param_name: str) -> float:
        """Add Gaussian noise to a parameter."""
        std_dev = value * (self.noise_pct.get(param_name, 2.0) / 100.0)
        return np.random.normal(value, std_dev)
    
    def _check_fault_active(self, hours_elapsed: float) -> bool:
        """Check if fault should be active at this timestamp."""
        if not self.fault_params:
            return False
        
        start = self.fault_params['start_hour']
        end = self.fault_params['end_hour']
        return start <= hours_elapsed < end
    
    def generate_sample(self, timestamp: datetime, hours_elapsed: float) -> Dict:
        """Generate a single telemetry sample."""
        # Check fault state
        fault_active = self._check_fault_active(hours_elapsed)
        
        # Base values with circadian patterns (daily cycles)
        hour_of_day = timestamp.hour + timestamp.minute / 60.0
        daily_cycle = np.sin(2 * np.pi * hour_of_day / 24)
        
        # Mill power follows production schedule (higher during day shift)
        mill_power = self.baselines['mill_power_kw'] + (50 * daily_cycle)
        
        # Throughput correlates with power
        throughput = self.baselines['mill_throughput_tph'] + (5 * daily_cycle)
        
        # Kiln temp has slower variation
        kiln_temp = self.baselines['kiln_temp_c'] + (10 * np.sin(2 * np.pi * hours_elapsed / 48))
        
        # Raw material chemistry (slower variation)
        raw_caO = self.baselines['raw_caO'] + (0.5 * np.sin(2 * np.pi * hours_elapsed / 72))
        raw_siO2 = self.baselines['raw_siO2']
        raw_al2O3 = self.baselines['raw_al2O3']
        raw_fe2O3 = self.baselines['raw_fe2O3']
        raw_moisture = self.baselines['raw_moisture'] + (0.3 * daily_cycle)
        
        # Apply fault modifications
        if fault_active:
            mods = self.fault_params['modifications']
            mill_power += mods.get('mill_power_kw', 0)
            throughput += mods.get('mill_throughput_tph', 0)
            kiln_temp += mods.get('kiln_temp_c', 0)
            raw_caO += mods.get('raw_caO', 0)
            raw_siO2 += mods.get('raw_siO2', 0)
            raw_al2O3 += mods.get('raw_al2O3', 0)
            raw_moisture += mods.get('raw_moisture', 0)
        
        # Add noise
        sample = {
            'timestamp': timestamp.isoformat(),
            'equipment_id': 'mill_01',
            'mill_power_kw': max(0, self._add_noise(mill_power, 'mill_power_kw')),
            'mill_throughput_tph': max(0, self._add_noise(throughput, 'mill_throughput_tph')),
            'separator_efficiency': np.clip(
                self._add_noise(self.baselines['separator_efficiency'], 'separator_efficiency'),
                0.7, 0.95
            ),
            'kiln_temp_c': self._add_noise(kiln_temp, 'kiln_temp_c'),
            'cooler_fan_rpm': max(0, self._add_noise(self.baselines['cooler_fan_rpm'], 'cooler_fan_rpm')),
            'raw_caO': self._add_noise(raw_caO, 'raw_caO'),
            'raw_siO2': self._add_noise(raw_siO2, 'raw_siO2'),
            'raw_al2O3': self._add_noise(raw_al2O3, 'raw_al2O3'),
            'raw_fe2O3': self._add_noise(raw_fe2O3, 'raw_fe2O3'),
            'raw_moisture': max(0, self._add_noise(raw_moisture, 'raw_moisture')),
            'clinker_temp_c': self._add_noise(self.baselines['clinker_temp_c'], 'clinker_temp_c')
        }
        
        # Fuel mix (apply faults if active)
        coal_pct = self.baselines['coal_pct']
        biomass_pct = self.baselines['biomass_pct']
        petcoke_pct = self.baselines['petcoke_pct']
        
        if fault_active:
            coal_pct += self.fault_params['modifications'].get('coal_pct', 0)
            biomass_pct += self.fault_params['modifications'].get('biomass_pct', 0)
        
        # Normalize to 100%
        total = coal_pct + biomass_pct + petcoke_pct
        sample['fuel_mix'] = json.dumps([
            {"fuel": "coal", "%": round(100 * coal_pct / total, 1)},
            {"fuel": "biomass", "%": round(100 * biomass_pct / total, 1)},
            {"fuel": "petcoke", "%": round(100 * petcoke_pct / total, 1)}
        ])
        
        # Calculated metrics
        sample['energy_per_ton_kwh'] = sample['mill_power_kw'] / max(sample['mill_throughput_tph'], 1)
        sample['thermal_substitution_rate'] = round(100 * biomass_pct / total, 1)
        
        return sample
    
    def generate_lab_sample(self, timestamp: datetime) -> Dict:
        """Generate periodic lab quality test results (every 4 hours)."""
        return {
            'timestamp': timestamp.isoformat(),
            'sample_id': f"LAB_{timestamp.strftime('%Y%m%d_%H%M')}",
            'compressive_strength_3d_mpa': self._add_noise(
                self.baselines['compressive_strength_mpa'] * 0.7, 'compressive_strength_mpa'
            ),
            'compressive_strength_7d_mpa': self._add_noise(
                self.baselines['compressive_strength_mpa'] * 0.85, 'compressive_strength_mpa'
            ),
            'compressive_strength_28d_mpa': self._add_noise(
                self.baselines['compressive_strength_mpa'], 'compressive_strength_mpa'
            ),
            'blaine_fineness_m2kg': self._add_noise(
                self.baselines['blaine_fineness_m2kg'], 'blaine_fineness_m2kg'
            ),
            'setting_time_initial_min': np.random.randint(90, 150),
            'setting_time_final_min': np.random.randint(200, 300)
        }


def main():
    parser = argparse.ArgumentParser(description='Generate synthetic cement plant telemetry')
    parser.add_argument('--hours', type=int, default=48, help='Hours of data to generate')
    parser.add_argument('--interval_seconds', type=int, default=60, help='Sampling interval')
    parser.add_argument('--output', type=str, default='synthetic_telemetry.csv', help='Output CSV file')
    parser.add_argument('--variability', type=str, default='medium', choices=['low', 'medium', 'high'])
    parser.add_argument('--fault_type', type=str, default=None,
                        choices=['raw_variability_spike', 'fuel_quality_drop', 'mill_vibration', 'cooler_fan_failure'])
    parser.add_argument('--fault_start_hour', type=int, default=12)
    parser.add_argument('--fault_duration_hours', type=int, default=12)
    parser.add_argument('--lab_output', type=str, default='synthetic_lab_results.csv')
    parser.add_argument('--seed', type=int, default=42, help='Random seed')
    
    args = parser.parse_args()
    
    # Initialize simulator
    simulator = CementPlantSimulator(variability=args.variability, seed=args.seed)
    
    # Configure fault injection
    if args.fault_type:
        simulator.inject_fault(args.fault_type, args.fault_start_hour, args.fault_duration_hours)
        print(f"⚠️  Fault injection enabled: {args.fault_type} at hour {args.fault_start_hour}")
    
    # Generate telemetry data
    start_time = datetime.now().replace(second=0, microsecond=0) - timedelta(hours=args.hours)
    samples = []
    
    print(f"Generating {args.hours} hours of telemetry data...")
    num_samples = int(args.hours * 3600 / args.interval_seconds)
    
    for i in range(num_samples):
        timestamp = start_time + timedelta(seconds=i * args.interval_seconds)
        hours_elapsed = i * args.interval_seconds / 3600
        
        sample = simulator.generate_sample(timestamp, hours_elapsed)
        samples.append(sample)
        
        if (i + 1) % 1000 == 0:
            print(f"  Generated {i + 1}/{num_samples} samples...")
    
    # Write telemetry CSV
    with open(args.output, 'w', newline='') as f:
        if samples:
            writer = csv.DictWriter(f, fieldnames=samples[0].keys())
            writer.writeheader()
            writer.writerows(samples)
    
    print(f"✅ Telemetry data written to {args.output} ({len(samples)} samples)")
    
    # Generate lab results (every 4 hours)
    lab_samples = []
    for hour_offset in range(0, args.hours, 4):
        timestamp = start_time + timedelta(hours=hour_offset)
        lab_sample = simulator.generate_lab_sample(timestamp)
        lab_samples.append(lab_sample)
    
    # Write lab results CSV
    with open(args.lab_output, 'w', newline='') as f:
        if lab_samples:
            writer = csv.DictWriter(f, fieldnames=lab_samples[0].keys())
            writer.writeheader()
            writer.writerows(lab_samples)
    
    print(f"✅ Lab results written to {args.lab_output} ({len(lab_samples)} samples)")
    
    # Summary statistics
    avg_energy = np.mean([s['energy_per_ton_kwh'] for s in samples])
    avg_thermal_sub = np.mean([s['thermal_substitution_rate'] for s in samples])
    avg_strength = np.mean([s['compressive_strength_28d_mpa'] for s in samples])
    
    print("\n📊 Summary Statistics:")
    print(f"  Avg Energy: {avg_energy:.2f} kWh/ton")
    print(f"  Avg Thermal Substitution: {avg_thermal_sub:.1f}%")
    print(f"  Avg 28-day Strength: {avg_strength:.1f} MPa")


if __name__ == '__main__':
    main()
