import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Clock,
  Lightbulb,
  AlertTriangle,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { getFromGemini } from "./vertexAiService";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ======================================================
   HELPERS
====================================================== */

const cleanJson = (s: string) =>
  s
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

const parseJson = (s?: string) => {
  if (!s) return { error: "Empty response from agent" };

  try {
    return JSON.parse(cleanJson(s));
  } catch (err) {
    return {
      error: "Invalid JSON returned by agent",
      raw: s,
    };
  }
};


/* ======================================================
   TELEMETRY SUB AGENTS
====================================================== */

const TelemetrySubAgents = {
  kiln: {
    name: "Kiln Agent",
    prompt: (telemetryHistory: any[]) => `
You are a Kiln Performance Expert.
Focus on kiln temperature stability, TSR, and flame stability.

Analyze the historical telemetry data for trends and patterns:

Telemetry History (most recent first):
${JSON.stringify(telemetryHistory, null, 2)}

Return JSON ONLY:
{ "issues": [], "observations": [] }
`,
  },
  rawMill: {
    name: "Raw Mill Agent",
    prompt: (telemetryHistory: any[]) => `
You are a Raw Mill Specialist.
Analyze power vs throughput and feed stability over time.

Telemetry History (most recent first):
${JSON.stringify(telemetryHistory, null, 2)}

Return JSON ONLY:
{ "issues": [], "observations": [] }
`,
  },
  cementMill: {
    name: "Cement Mill Agent",
    prompt: (telemetryHistory: any[]) => `
You are a Cement Mill Optimization Expert.
Analyze separator efficiency and grinding trends over time.

Telemetry History (most recent first):
${JSON.stringify(telemetryHistory, null, 2)}

Return JSON ONLY:
{ "issues": [], "observations": [] }
`,
  },
  energy: {
    name: "Energy Agent",
    prompt: (telemetryHistory: any[]) => `
You are an Energy Efficiency Auditor.
Analyze kWh/ton and abnormal power draw patterns over time.

Telemetry History (most recent first):
${JSON.stringify(telemetryHistory, null, 2)}

Return JSON ONLY:
{ "issues": [], "observations": [] }
`,
  },
};

/* ======================================================
   SUPER / OPT / SAFETY AGENTS
====================================================== */

const TelemetrySuperAgent = {
  name: "Telemetry Super Agent",
  prompt: (outputs: any[]) => `
You are the Telemetry Super Agent.
Merge, deduplicate, and prioritize issues.

Inputs:
${JSON.stringify(outputs, null, 2)}

Return JSON ONLY:
{ "issues": [], "observations": [] }
`,
};

const OptimizationAgent = {
  name: "Optimization Agent",
  prompt: (analysis: any) => `
You are a Cement Plant Optimization Expert.

Based on the analysis, propose ONE actionable optimization.

Analysis:
${JSON.stringify(analysis, null, 2)}

Return JSON ONLY:
{
  "action": "",
  "expected_energy_delta_kwh_ton": -3.0,
  "confidence": 0.8,
  "quality_impact": "negligible"
}
`,
};

const SafetyGateAgent = {
  name: "Safety Gate Agent",
  prompt: (proposal: any) => `
You are the Safety & Quality Assurance Guardian.

Proposal:
${JSON.stringify(proposal, null, 2)}

Return JSON ONLY:
{
  "risk_level": "low",
  "decision": "approved",
  "reason": ""
}
`,
};

/* ======================================================
   COMPONENT
====================================================== */

interface AgentBuilderProps {
  telemetryHistory: any[];
  onProposalGenerated?: (p: any) => void;
  onAnalysisComplete: (h: any) => void;
}

function renderValue(value: any): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) return value.map(renderValue).join(", ");
  if (typeof value === "object")
    return value.message || JSON.stringify(value, null, 2);
  return String(value);
}

export default function AgentBuilder({
  telemetryHistory,
  onProposalGenerated,
  onAnalysisComplete,
}: AgentBuilderProps) {
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);
  const [finalProposal, setFinalProposal] = useState<any>(null);

  const updateStep = (agent: string, data: any) =>
    setSteps((s) => s.map((x) => (x.agent === agent ? { ...x, ...data } : x)));

  const runAgents = async () => {
    setRunning(true);
    setSteps([]);
    setFinalProposal(null);

    /* ================= TELEMETRY ================= */

    setSteps([{ agent: TelemetrySuperAgent.name, status: "running" }]);

    const subOutputs: any[] = [];

    for (const key of Object.keys(TelemetrySubAgents)) {
      const a = TelemetrySubAgents[key as keyof typeof TelemetrySubAgents];

      setSteps((s) => [
        ...s,
        { agent: a.name, parent: "telemetry", status: "running" },
      ]);

      const out = await getFromGemini(a.prompt(telemetryHistory));
      const parsed = parseJson(out);

      subOutputs.push({ agent: a.name, ...parsed });

      updateStep(a.name, { status: "done", output: parsed });
    }

    const superOut = await getFromGemini(
      TelemetrySuperAgent.prompt(subOutputs)
    );
    const telemetryResult = parseJson(superOut);

    updateStep(TelemetrySuperAgent.name, {
      status: "done",
      output: telemetryResult,
    });

    /* ================= OPTIMIZATION ================= */

    setSteps((s) => [
      ...s,
      { agent: OptimizationAgent.name, status: "running" },
    ]);

    const optOut = await getFromGemini(
      OptimizationAgent.prompt(telemetryResult)
    );
    const optParsed = parseJson(optOut);

    updateStep(OptimizationAgent.name, {
      status: "done",
      output: optParsed,
    });

    /* ================= SAFETY ================= */

    setSteps((s) => [...s, { agent: SafetyGateAgent.name, status: "running" }]);

    const safetyOut = await getFromGemini(SafetyGateAgent.prompt(optParsed));
    const safetyParsed = parseJson(safetyOut);

    updateStep(SafetyGateAgent.name, {
      status: "done",
      output: safetyParsed,
    });

    /* ================= FINAL ================= */

    const proposal = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...optParsed,
      ...safetyParsed,
      rationale: safetyParsed.reason,
      safety_gate_decision: safetyParsed.decision,
    };

    setFinalProposal(proposal);
    onProposalGenerated?.(proposal);

    if (proposal.safety_gate_decision === "approved") {
      onAnalysisComplete({
        time: new Date().toLocaleTimeString("en-GB"),
        action: proposal.action,
        result: `${proposal.expected_energy_delta_kwh_ton.toFixed(1)} kWh/ton`,
        status: "success",
      });
    }

    setRunning(false);
  };

  /* ======================================================
     UI
  ====================================================== */

  return (
    <Card className="p-6 space-y-6 border-primary/30 bg-gradient-surface">
      <div className="flex items-center gap-3">
        <Brain className="h-7 w-7 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">
            AI Operational Decision Engine
          </h2>
          <p className="text-sm text-muted-foreground">
            Multi-agent decision pipeline
          </p>
        </div>
      </div>

      {/* AGENT FLOW */}
      <div className="space-y-3">
        {/* TELEMETRY */}
        <Card className="p-4 border-primary/40">
          <div className="flex items-center gap-2 font-medium">
            <Clock className="h-5 w-5 text-primary" />
            Telemetry Super Agent
          </div>

          <div className="mt-3 pl-4 space-y-2 border-l">
            {Object.values(TelemetrySubAgents).map((a) => {
              const step = steps.find((s) => s.agent === a.name);
              return (
                <div key={a.name} className="flex items-center gap-2 text-sm">
                  <ChevronRight className="h-4 w-4" />
                  {a.name}
                  <Badge className="ml-auto" variant="outline">
                    {step?.status ?? "pending"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* OPTIMIZATION */}
        <Card className="p-4 border-primary/40">
          <div className="flex items-center gap-2 font-medium">
            <Lightbulb className="h-5 w-5 text-primary" />
            Optimization Agent
          </div>
        </Card>

        {/* SAFETY */}
        <Card className="p-4 border-primary/40">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Safety Gate Agent
          </div>
        </Card>
      </div>

      {/* DETAILS */}
      <Accordion type="single" collapsible>
        <AccordionItem value="details">
          <AccordionTrigger>View Agent Outputs</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-4">
            {steps.map((s, i) => (
              <Card key={i} className="p-4">
                <div className="flex justify-between">
                  <h4 className="font-semibold">{s.agent}</h4>
                  {s.status === "done" && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>

                {s.output?.issues && (
                  <ul className="mt-2 list-disc ml-5 text-sm">
                    {s.output.issues.map((x: string, i: number) => (
                      <li key={i}>{renderValue(x)}</li>
                    ))}
                  </ul>
                )}

                {s.output?.action && (
                  <p className="mt-2 text-sm">
                    <strong>Action:</strong> {s.output.action}
                  </p>
                )}

                {s.output?.reason && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {renderValue(s.output.reason)}
                  </p>
                )}
              </Card>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* FINAL */}
      {finalProposal && (
        <Card className="p-5 border-2 border-primary/50">
          <h3 className="font-semibold mb-2">Final Recommendation</h3>
<p>{renderValue(finalProposal.action)}</p>
          <div className="text-xs text-muted-foreground mt-1">
            Energy: {finalProposal.expected_energy_delta_kwh_ton} kWh/ton •
            Confidence {(finalProposal.confidence * 100).toFixed(0)}% • Risk{" "}
            {finalProposal.risk_level}
          </div>
          <Badge className="mt-2">
            {finalProposal.safety_gate_decision.toUpperCase()}
          </Badge>
        </Card>
      )}

      <Button disabled={running} onClick={runAgents} className="w-full h-12">
        {running ? "Running AI Agents..." : "Run AI Analysis"}
      </Button>
    </Card>
  );
}
