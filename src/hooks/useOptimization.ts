import { useState, useEffect } from 'react';

interface OptimizationProposal {
  id: string;
  timestamp: string;
  action: string;
  expected_energy_delta_kwh_ton: number;
  expected_quality_impact: 'negligible' | 'minor' | 'moderate';
  confidence: number;
  rationale: string;
  risk_level: 'low' | 'medium' | 'high';
  safety_gate_decision: 'approved' | 'rejected' | 'escalated';
  safety_rejection_reason?: string;
}

export const useOptimization = () => {
  const [proposals, setProposals] = useState<OptimizationProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate synthetic proposals for demo
    const generateProposals = (): OptimizationProposal[] => {
      const sampleProposals = [
        {
          id: 'opt_001',
          timestamp: new Date().toISOString(),
          action: 'Reduce mill power to 1235 kW',
          expected_energy_delta_kwh_ton: -3.8,
          expected_quality_impact: 'negligible' as const,
          confidence: 0.87,
          rationale: 'Current separator efficiency is 88%, allowing 50kW reduction without throughput loss. Raw moisture is low (1.8%), supporting grinding efficiency. Historical data shows similar conditions resulted in 3.5 kWh/ton savings with no quality degradation.',
          risk_level: 'low' as const,
          safety_gate_decision: 'approved' as const
        },
        {
          id: 'opt_002',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          action: 'Increase biomass fuel ratio to 28%',
          expected_energy_delta_kwh_ton: -1.2,
          expected_quality_impact: 'minor' as const,
          confidence: 0.73,
          rationale: 'Kiln temperature is stable at 1418°C with margin for alternative fuel increase. Biomass calorific value is within acceptable range (16.2 MJ/kg). This change will improve thermal substitution rate while maintaining clinker quality. Recommended gradual implementation over 2 hours.',
          risk_level: 'medium' as const,
          safety_gate_decision: 'approved' as const
        }
      ];

      return sampleProposals;
    };

    setProposals(generateProposals());
    setLoading(false);

    // Simulate new proposals appearing
    const interval = setInterval(() => {
      // Random chance of new proposal
      if (Math.random() > 0.7) {
        const newProposal = generateProposals()[0];
        newProposal.id = `opt_${Date.now()}`;
        newProposal.timestamp = new Date().toISOString();
        setProposals(prev => [newProposal, ...prev].slice(0, 3));
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const approveProposal = (id: string) => {
    setProposals(prev => prev.filter(p => p.id !== id));
  };

  const rejectProposal = (id: string) => {
    setProposals(prev => prev.filter(p => p.id !== id));
  };

  return { proposals, loading, approveProposal, rejectProposal };
};
