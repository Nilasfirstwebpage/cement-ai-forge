import { useState, useCallback } from "react";
import { Proposal as OptimizationProposal } from "@/components/dashboard/vertexAiService";
import { TelemetryData } from "./useTelemetry";

export const useOptimization = (
  initialProposals: OptimizationProposal[] = [
    {
      id: 'mock-1',
      action: 'Increase Kiln Temperature by 5°C',
      rationale: 'Based on current raw material analysis, a slight increase in kiln temperature will improve clinker quality and reduce fuel consumption by 1.5%.',
      expected_energy_delta_kwh_ton: -1.5,
      expected_quality_impact: 'negligible',
      risk_level: 'low',
      confidence: 0.95,
      safety_gate_decision: 'approved',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'mock-2',
      action: 'Adjust Coal Mill Fan Speed to 80%',
      rationale: 'Optimizing coal mill fan speed will achieve finer grinding, leading to better combustion efficiency and a 0.8% reduction in NOx emissions.',
      expected_energy_delta_kwh_ton: -0.7,
      expected_quality_impact: 'minor',
      risk_level: 'medium',
      confidence: 0.88,
      safety_gate_decision: 'escalated',
      safety_rejection_reason: 'Potential for increased noise pollution.',
      timestamp: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
    },
    {
      id: 'mock-3',
      action: 'Reduce Cooler Grate Speed by 10%',
      rationale: 'Slower grate speed will allow for more efficient heat recovery in the clinker cooler, recapturing 0.5 GCal/ton of heat and decreasing overall energy demand.',
      expected_energy_delta_kwh_ton: -1.0,
      expected_quality_impact: 'negligible',
      risk_level: 'low',
      confidence: 0.92,
      safety_gate_decision: 'approved',
      timestamp: new Date(Date.now() - 7200 * 1000).toISOString(), // 2 hours ago
    },
  ],
  initialHistory: any[] = [
    { time: '14:23', action: 'Reduced mill power to 1235 kW', result: '-3.8 kWh/ton', status: 'success' },
    { time: '13:18', action: 'Increased separator efficiency target', result: '-2.1 kWh/ton', status: 'success' },
    { time: '12:05', action: 'Adjusted fuel mix ratio', result: 'Rejected by operator', status: 'rejected' }
  ]
) => {
  const [proposals, setProposals] = useState<OptimizationProposal[]>(initialProposals);
  const [history, setHistory] = useState(initialHistory);
  const [loading, setLoading] = useState(false);

  const addProposal = useCallback((proposal: OptimizationProposal) => {
    setProposals((prev) => [proposal, ...prev]);
  }, []);

  const approveProposal = (id: string) => {
    setProposals((prev) => prev.filter((p) => p.id !== id));
  };

  const rejectProposal = (id: string) => {
    setProposals((prev) => prev.filter((p) => p.id !== id));
  };

  const addHistoryEntry = useCallback((historyItem: any) => {
    setHistory(prevHistory => [historyItem, ...prevHistory]);
  }, []);

  return {
    proposals,
    loading,
    addProposal,
    approveProposal,
    rejectProposal,
    history,
    addHistoryEntry,
  };
};
