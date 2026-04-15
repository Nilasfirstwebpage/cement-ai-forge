import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, CheckCircle, XCircle, Clock, AlertTriangle, TrendingDown, 
  Activity, Shield, Database, Cpu, Radio, Wifi, WifiOff, 
  ChevronRight, Zap, Eye, Flame, Wind, Gauge, Thermometer,
  ArrowRight, RotateCcw, Play, Square
} from 'lucide-react';
import { useOptimization } from '@/hooks/useOptimization';
import { useTelemetry } from '@/hooks/useTelemetry';
import { TelemetryData } from '@/types/telemetry';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getFromGemini } from './vertexAiService';

/* ========== DCS SYSTEM DEFINITIONS ========== */

interface DCSSystem {
  id: string;
  name: string;
  icon: any;
  protocol: string;
  status: 'online' | 'offline' | 'intermittent' | 'polling';
  lastPing: number;
  fields: string[];
  latency: number;
}

const DCS_SYSTEMS: DCSSystem[] = [
  { id: 'kiln_plc', name: 'Kiln PLC', icon: Flame, protocol: 'OPC-UA', status: 'online', lastPing: 0, fields: ['kiln_temp_c', 'clinker_temp_c'], latency: 45 },
  { id: 'rawmill_dcs', name: 'Raw Mill DCS', icon: Gauge, protocol: 'Modbus TCP', status: 'online', lastPing: 0, fields: ['mill_power_kw', 'mill_throughput_tph'], latency: 120 },
  { id: 'cement_mill', name: 'Cement Mill SCADA', icon: Activity, protocol: 'OPC-DA', status: 'online', lastPing: 0, fields: ['separator_efficiency'], latency: 85 },
  { id: 'fuel_sys', name: 'Fuel System', icon: Zap, protocol: 'MQTT', status: 'online', lastPing: 0, fields: ['thermal_substitution_rate', 'fuel_mix'], latency: 200 },
  { id: 'cooler_plc', name: 'Cooler PLC', icon: Wind, protocol: 'OPC-UA', status: 'online', lastPing: 0, fields: ['cooler_fan_rpm'], latency: 65 },
  { id: 'lab_qcx', name: 'Lab QCX', icon: Eye, protocol: 'REST API', status: 'online', lastPing: 0, fields: ['raw_caO', 'raw_siO2', 'raw_al2O3', 'raw_fe2O3'], latency: 5000 },
  { id: 'energy_meter', name: 'Energy Meters', icon: Thermometer, protocol: 'IEC 61850', status: 'online', lastPing: 0, fields: ['energy_per_ton_kwh'], latency: 150 },
];

/* ========== AGENT DEFINITIONS ========== */

interface AgentNode {
  id: string;
  name: string;
  role: 'sub' | 'super' | 'optimizer' | 'safety' | 'executor';
  status: 'idle' | 'waiting' | 'running' | 'done' | 'error';
  dependsOn: string[];
  output?: any;
  duration?: number;
  inputSystems?: string[];
}

const INITIAL_AGENTS: AgentNode[] = [
  { id: 'kiln_agent', name: 'Kiln Thermal Agent', role: 'sub', status: 'idle', dependsOn: [], inputSystems: ['kiln_plc', 'cooler_plc'] },
  { id: 'mill_agent', name: 'Grinding Agent', role: 'sub', status: 'idle', dependsOn: [], inputSystems: ['rawmill_dcs', 'cement_mill'] },
  { id: 'energy_agent', name: 'Energy Agent', role: 'sub', status: 'idle', dependsOn: [], inputSystems: ['energy_meter', 'fuel_sys'] },
  { id: 'quality_agent', name: 'Quality Agent', role: 'sub', status: 'idle', dependsOn: [], inputSystems: ['lab_qcx'] },
  { id: 'super_agent', name: 'Orchestrator (Super Agent)', role: 'super', status: 'idle', dependsOn: ['kiln_agent', 'mill_agent', 'energy_agent', 'quality_agent'] },
  { id: 'opt_agent', name: 'Optimization Agent', role: 'optimizer', status: 'idle', dependsOn: ['super_agent'] },
  { id: 'safety_agent', name: 'Safety Gate Agent', role: 'safety', status: 'idle', dependsOn: ['opt_agent'] },
  { id: 'exec_agent', name: 'Execution Agent', role: 'executor', status: 'idle', dependsOn: ['safety_agent'] },
];

/* ========== PROMPTS ========== */

const cleanJson = (s: string) => s.replace(/```json/g, '').replace(/```/g, '').trim();
const parseJson = (s?: string) => {
  if (!s) return { error: 'Empty response' };
  try { return JSON.parse(cleanJson(s)); } catch { return { error: 'Parse failed', raw: s }; }
};

const agentPrompts: Record<string, (data: any) => string> = {
  kiln_agent: (d) => `You are a Kiln Thermal Expert. Analyze: ${JSON.stringify(d)}. Return JSON: {"issues":[],"observations":[],"risk":"low|medium|high"}`,
  mill_agent: (d) => `You are a Grinding Mill Expert. Analyze: ${JSON.stringify(d)}. Return JSON: {"issues":[],"observations":[],"risk":"low|medium|high"}`,
  energy_agent: (d) => `You are an Energy Efficiency Auditor. Analyze: ${JSON.stringify(d)}. Return JSON: {"issues":[],"observations":[],"risk":"low|medium|high"}`,
  quality_agent: (d) => `You are a Quality Control Expert. Analyze: ${JSON.stringify(d)}. Return JSON: {"issues":[],"observations":[],"risk":"low|medium|high"}`,
  super_agent: (d) => `You are the Orchestrator Super Agent. Merge and prioritize sub-agent outputs: ${JSON.stringify(d)}. Return JSON: {"priority_issues":[],"merged_observations":[],"overall_risk":"low|medium|high","recommendation_focus":""}`,
  opt_agent: (d) => `You are a Cement Plant Optimizer. Based on analysis: ${JSON.stringify(d)}, propose ONE optimization. Return JSON: {"action":"","expected_energy_delta_kwh_ton":-1.5,"confidence":0.9,"quality_impact":"negligible","rationale":""}`,
  safety_agent: (d) => `You are the Safety Gate Guardian. Validate proposal: ${JSON.stringify(d)}. Return JSON: {"risk_level":"low","decision":"approved","reason":"","constraints_checked":["temp_limits","emission_limits","equipment_stress"]}`,
};

/* ========== COMPONENT ========== */

interface OptimizationPanelProps {
  latestTelemetryData?: TelemetryData | null;
}

const OptimizationPanel = ({ latestTelemetryData }: OptimizationPanelProps) => {
  const { proposals, loading, addProposal, approveProposal, rejectProposal, history: optimizationHistory, addHistoryEntry } = useOptimization();
  const { history: telemetryHistory } = useTelemetry();
  const [dcsSystems, setDcsSystems] = useState<DCSSystem[]>(DCS_SYSTEMS);
  const [agents, setAgents] = useState<AgentNode[]>(INITIAL_AGENTS);
  const [running, setRunning] = useState(false);
  const [orchestrationLog, setOrchestrationLog] = useState<string[]>([]);
  const [finalProposal, setFinalProposal] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Simulate DCS systems going online/offline randomly
  useEffect(() => {
    const interval = setInterval(() => {
      setDcsSystems(prev => prev.map(sys => {
        const rand = Math.random();
        let newStatus = sys.status;
        if (rand < 0.03) newStatus = 'offline';
        else if (rand < 0.08) newStatus = 'intermittent';
        else if (rand < 0.5 && sys.status !== 'online') newStatus = 'online';
        return { ...sys, status: newStatus, lastPing: Date.now(), latency: sys.latency + Math.floor(Math.random() * 40 - 20) };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Timer
  useEffect(() => {
    let interval: any;
    if (timerActive) {
      interval = setInterval(() => setElapsedTime(p => p + 100), 100);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const log = useCallback((msg: string) => {
    setOrchestrationLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const updateAgent = useCallback((id: string, updates: Partial<AgentNode>) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const handleApprove = (proposalId: string) => {
    approveProposal(proposalId);
    toast.success('Optimization approved & dispatched to Execution Agent');
  };

  const handleReject = (proposalId: string) => {
    rejectProposal(proposalId);
    toast.error('Optimization rejected — logged for audit');
  };

  const runOrchestration = async () => {
    setRunning(true);
    setAgents(INITIAL_AGENTS);
    setOrchestrationLog([]);
    setFinalProposal(null);
    setElapsedTime(0);
    setTimerActive(true);

    const onlineSystems = dcsSystems.filter(s => s.status === 'online' || s.status === 'intermittent');
    log(`Orchestration started — ${onlineSystems.length}/${dcsSystems.length} DCS systems available`);

    // Phase 1: Sub-agents (parallel where possible)
    const subAgents = agents.filter(a => a.role === 'sub');
    const subOutputs: Record<string, any> = {};

    log('Phase 1: Dispatching sub-agents to available DCS systems...');

    for (const sub of subAgents) {
      const availableSystems = (sub.inputSystems || []).filter(sysId => {
        const sys = dcsSystems.find(s => s.id === sysId);
        return sys && (sys.status === 'online' || sys.status === 'intermittent');
      });

      if (availableSystems.length === 0) {
        updateAgent(sub.id, { status: 'error' });
        log(`⚠ ${sub.name}: No DCS systems available — skipped`);
        subOutputs[sub.id] = { issues: [], observations: ['No data — DCS offline'], risk: 'unknown' };
        continue;
      }

      updateAgent(sub.id, { status: 'running' });
      log(`▶ ${sub.name}: Reading from ${availableSystems.join(', ')}...`);

      const start = Date.now();
      const out = await getFromGemini(agentPrompts[sub.id](telemetryHistory.slice(0, 5)));
      const parsed = parseJson(out);
      const dur = Date.now() - start;

      subOutputs[sub.id] = parsed;
      updateAgent(sub.id, { status: 'done', output: parsed, duration: dur });
      log(`✓ ${sub.name}: Completed in ${dur}ms — Risk: ${parsed.risk || 'n/a'}`);
    }

    // Phase 2: Super Agent
    log('Phase 2: Orchestrator merging sub-agent outputs...');
    updateAgent('super_agent', { status: 'running' });
    const superStart = Date.now();
    const superOut = await getFromGemini(agentPrompts.super_agent(subOutputs));
    const superParsed = parseJson(superOut);
    const superDur = Date.now() - superStart;
    updateAgent('super_agent', { status: 'done', output: superParsed, duration: superDur });
    log(`✓ Orchestrator: Merged ${Object.keys(subOutputs).length} outputs in ${superDur}ms`);

    // Phase 3: Optimization Agent
    log('Phase 3: Generating optimization proposal...');
    updateAgent('opt_agent', { status: 'running' });
    const optStart = Date.now();
    const optOut = await getFromGemini(agentPrompts.opt_agent(superParsed));
    const optParsed = parseJson(optOut);
    const optDur = Date.now() - optStart;
    updateAgent('opt_agent', { status: 'done', output: optParsed, duration: optDur });
    log(`✓ Optimizer: Proposed "${optParsed.action}" (${optDur}ms)`);

    // Phase 4: Safety Gate
    log('Phase 4: Safety gate validation...');
    updateAgent('safety_agent', { status: 'running' });
    const safetyStart = Date.now();
    const safetyOut = await getFromGemini(agentPrompts.safety_agent(optParsed));
    const safetyParsed = parseJson(safetyOut);
    const safetyDur = Date.now() - safetyStart;
    updateAgent('safety_agent', { status: 'done', output: safetyParsed, duration: safetyDur });
    log(`✓ Safety Gate: ${safetyParsed.decision?.toUpperCase()} — ${safetyParsed.reason} (${safetyDur}ms)`);

    // Phase 5: Execution
    updateAgent('exec_agent', { status: safetyParsed.decision === 'approved' ? 'done' : 'error' });
    log(safetyParsed.decision === 'approved' 
      ? '✓ Execution Agent: Proposal queued for operator approval' 
      : '✗ Execution Agent: Proposal blocked by safety gate');

    const proposal = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action: optParsed.action || 'No action',
      rationale: optParsed.rationale || safetyParsed.reason || '',
      expected_energy_delta_kwh_ton: optParsed.expected_energy_delta_kwh_ton || 0,
      expected_quality_impact: optParsed.quality_impact || 'negligible',
      risk_level: safetyParsed.risk_level || 'low',
      confidence: optParsed.confidence || 0.85,
      safety_gate_decision: safetyParsed.decision || 'approved',
      safety_rejection_reason: safetyParsed.decision !== 'approved' ? safetyParsed.reason : undefined,
    };

    setFinalProposal(proposal);
    addProposal(proposal);
    setTimerActive(false);
    log(`Pipeline complete in ${((Date.now()) / 1000).toFixed(1)}s`);

    if (proposal.safety_gate_decision === 'approved') {
      addHistoryEntry({
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        action: proposal.action,
        result: `${proposal.expected_energy_delta_kwh_ton.toFixed(1)} kWh/ton`,
        status: 'success',
      });
    }

    setRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="h-3 w-3 text-success" />;
      case 'offline': return <WifiOff className="h-3 w-3 text-destructive" />;
      case 'intermittent': return <Radio className="h-3 w-3 text-warning animate-pulse" />;
      case 'polling': return <RotateCcw className="h-3 w-3 text-primary animate-spin" />;
      default: return <Wifi className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'border-border bg-muted/20';
      case 'waiting': return 'border-warning/50 bg-warning/5';
      case 'running': return 'border-primary/50 bg-primary/5 shadow-[0_0_12px_hsl(var(--primary)/0.15)]';
      case 'done': return 'border-success/50 bg-success/5';
      case 'error': return 'border-destructive/50 bg-destructive/5';
      default: return 'border-border';
    }
  };

  const getAgentStatusBadge = (status: string) => {
    switch (status) {
      case 'idle': return <Badge variant="outline" className="text-[10px]">Idle</Badge>;
      case 'running': return <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30 animate-pulse">Running</Badge>;
      case 'done': return <Badge className="text-[10px] bg-success/20 text-success border-success/30">Done</Badge>;
      case 'error': return <Badge className="text-[10px] bg-destructive/20 text-destructive border-destructive/30">Error</Badge>;
      case 'waiting': return <Badge className="text-[10px] bg-warning/20 text-warning border-warning/30">Waiting</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const subAgents = agents.filter(a => a.role === 'sub');
  const superAgent = agents.find(a => a.role === 'super')!;
  const optAgent = agents.find(a => a.role === 'optimizer')!;
  const safetyAgent = agents.find(a => a.role === 'safety')!;
  const execAgent = agents.find(a => a.role === 'executor')!;

  return (
    <div className="space-y-4">
      {/* DCS Systems Status Bar */}
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <h3 className="text-xs sm:text-sm font-semibold">DCS / SCADA Systems</h3>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {dcsSystems.filter(s => s.status === 'online').length}/{dcsSystems.length} Online
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {dcsSystems.map(sys => {
            const Icon = sys.icon;
            return (
              <div key={sys.id} className={`flex items-center gap-1.5 p-2 rounded-md border text-[10px] sm:text-xs transition-all ${
                sys.status === 'online' ? 'border-success/30 bg-success/5' :
                sys.status === 'offline' ? 'border-destructive/30 bg-destructive/5 opacity-50' :
                'border-warning/30 bg-warning/5'
              }`}>
                {getStatusIcon(sys.status)}
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{sys.name}</div>
                  <div className="text-muted-foreground">{sys.protocol} · {sys.latency}ms</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Agent Orchestration Diagram */}
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <h3 className="text-xs sm:text-sm font-semibold">Agent Orchestration Pipeline</h3>
          </div>
          <div className="flex items-center gap-2">
            {timerActive && (
              <span className="text-xs text-muted-foreground font-mono">{(elapsedTime / 1000).toFixed(1)}s</span>
            )}
            <Button
              size="sm"
              disabled={running}
              onClick={runOrchestration}
              className="h-7 text-xs gap-1"
            >
              {running ? (
                <>
                  <Square className="h-3 w-3" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Run Pipeline
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Visual Pipeline */}
        <div className="space-y-3">
          {/* Layer 1: Sub-Agents */}
          <div>
            <div className="text-[10px] text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              LAYER 1 — Domain Sub-Agents (Parallel)
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {subAgents.map(agent => (
                <div key={agent.id} className={`p-2.5 rounded-lg border-2 transition-all duration-300 ${getAgentStatusColor(agent.status)}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] sm:text-xs font-semibold truncate">{agent.name}</span>
                    {getAgentStatusBadge(agent.status)}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    Sources: {(agent.inputSystems || []).map(sysId => {
                      const sys = dcsSystems.find(s => s.id === sysId);
                      return sys ? (
                        <span key={sysId} className={`inline-flex items-center gap-0.5 mr-1 ${sys.status === 'online' ? 'text-success' : sys.status === 'offline' ? 'text-destructive' : 'text-warning'}`}>
                          {getStatusIcon(sys.status)} {sys.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                  {agent.duration && <div className="text-[9px] text-muted-foreground mt-1">{agent.duration}ms</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="flex flex-col items-center">
              <div className="w-px h-3 bg-border" />
              <ArrowRight className="h-4 w-4 text-primary rotate-90" />
              <div className="w-px h-3 bg-border" />
            </div>
          </div>

          {/* Layer 2: Super Agent */}
          <div>
            <div className="text-[10px] text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              LAYER 2 — Orchestrator (Super Agent)
            </div>
            <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${getAgentStatusColor(superAgent.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-accent" />
                  <span className="text-xs sm:text-sm font-semibold">{superAgent.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {superAgent.duration && <span className="text-[10px] text-muted-foreground">{superAgent.duration}ms</span>}
                  {getAgentStatusBadge(superAgent.status)}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Merges, deduplicates, and risk-prioritizes all sub-agent findings</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="flex flex-col items-center">
              <div className="w-px h-3 bg-border" />
              <ArrowRight className="h-4 w-4 text-primary rotate-90" />
              <div className="w-px h-3 bg-border" />
            </div>
          </div>

          {/* Layer 3: Optimizer + Safety + Executor */}
          <div>
            <div className="text-[10px] text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              LAYER 3 — Decision & Execution (Sequential)
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {[
                { agent: optAgent, icon: <Brain className="h-4 w-4 text-primary" />, desc: 'Generates actionable optimization proposal' },
                { agent: safetyAgent, icon: <Shield className="h-4 w-4 text-warning" />, desc: 'Validates against safety constraints' },
                { agent: execAgent, icon: <CheckCircle className="h-4 w-4 text-success" />, desc: 'Queues for operator approval & execution' },
              ].map(({ agent, icon, desc }, i) => (
                <div key={agent.id} className="flex-1 flex items-stretch gap-2">
                  <div className={`flex-1 p-2.5 rounded-lg border-2 transition-all duration-300 ${getAgentStatusColor(agent.status)}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {icon}
                        <span className="text-[10px] sm:text-xs font-semibold">{agent.name}</span>
                      </div>
                      {getAgentStatusBadge(agent.status)}
                    </div>
                    <p className="text-[9px] text-muted-foreground">{desc}</p>
                    {agent.duration && <div className="text-[9px] text-muted-foreground mt-1">{agent.duration}ms</div>}
                  </div>
                  {i < 2 && (
                    <div className="hidden sm:flex items-center">
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Orchestration Log */}
      {orchestrationLog.length > 0 && (
        <Card className="p-3 sm:p-4">
          <Accordion type="single" collapsible defaultValue="log">
            <AccordionItem value="log" className="border-none">
              <AccordionTrigger className="py-0 text-xs sm:text-sm font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Orchestration Log ({orchestrationLog.length} events)
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-3">
                <div className="bg-muted/30 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-[10px] sm:text-xs space-y-0.5">
                  {orchestrationLog.map((entry, i) => (
                    <div key={i} className={`${
                      entry.includes('✓') ? 'text-success' :
                      entry.includes('⚠') ? 'text-warning' :
                      entry.includes('✗') ? 'text-destructive' :
                      'text-muted-foreground'
                    }`}>
                      {entry}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      )}

      {/* Final Proposal */}
      {finalProposal && (
        <Card className="p-4 border-2 border-primary/40">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold">Pipeline Output — Recommendation</h3>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">{finalProposal.action}</p>
            <p className="text-xs text-muted-foreground">{finalProposal.rationale}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                Energy: {finalProposal.expected_energy_delta_kwh_ton > 0 ? '+' : ''}{finalProposal.expected_energy_delta_kwh_ton?.toFixed(1)} kWh/ton
              </Badge>
              <Badge variant="outline" className="text-xs">
                Confidence: {(finalProposal.confidence * 100).toFixed(0)}%
              </Badge>
              <Badge className={`text-xs ${
                finalProposal.safety_gate_decision === 'approved' ? 'bg-success/20 text-success border-success/30' : 'bg-destructive/20 text-destructive border-destructive/30'
              }`}>
                {finalProposal.safety_gate_decision?.toUpperCase()}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Pending Proposals */}
      {proposals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Pending Proposals ({proposals.length})</h3>
          {proposals.map(proposal => (
            <Card key={proposal.id} className="p-3 sm:p-4 border-l-4 transition-all hover:shadow-card"
              style={{ borderLeftColor: proposal.risk_level === 'low' ? 'hsl(var(--success))' : proposal.risk_level === 'medium' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))' }}>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      <Badge variant={proposal.risk_level === 'low' ? 'default' : proposal.risk_level === 'medium' ? 'outline' : 'destructive'} className="text-[10px]">{proposal.risk_level} risk</Badge>
                      <Badge variant="outline" className="text-[10px]">{(proposal.confidence * 100).toFixed(0)}%</Badge>
                    </div>
                    <h4 className="text-xs sm:text-sm font-semibold">{proposal.action}</h4>
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{proposal.rationale}</p>
                <div className="flex items-center gap-2 text-xs">
                  <TrendingDown className={`h-3 w-3 ${proposal.expected_energy_delta_kwh_ton < 0 ? 'text-success' : 'text-destructive'}`} />
                  <span className={proposal.expected_energy_delta_kwh_ton < 0 ? 'text-success' : 'text-destructive'}>
                    {proposal.expected_energy_delta_kwh_ton > 0 ? '+' : ''}{proposal.expected_energy_delta_kwh_ton.toFixed(1)} kWh/ton
                  </span>
                </div>
                {proposal.safety_gate_decision === 'approved' && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => handleApprove(proposal.id)} className="h-7 text-xs flex-1 bg-success/20 text-success hover:bg-success/30 border border-success/30">
                      <CheckCircle className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReject(proposal.id)} className="h-7 text-xs flex-1">
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* History */}
      <Card className="p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-semibold mb-2">Optimization History</h3>
        <div className="space-y-1.5">
          {optimizationHistory.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded bg-muted/20 text-[10px] sm:text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-mono">{item.time}</span>
                <span>{item.action}</span>
              </div>
              <Badge variant={item.status === 'success' ? 'default' : 'outline'} className="text-[10px]">{item.result}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default OptimizationPanel;
