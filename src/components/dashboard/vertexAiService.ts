// src/components/dashboard/vertexAiService.ts
import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { GEMINI_API_KEY, GEMINI_MODEL_NAME } from './vertexAiConfig';
import { TelemetryData } from '@/hooks/useTelemetry';

// NOTE: You need to install the Google Generative AI package for this service to work:
// npm install @google/generative-ai

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface FlameAnalysis {
  flameTemp: number;
  coreBrightness: number;
  thermalUniformity: number;
  turbulenceIndex: number;
  fuelAirBalance: 'Rich' | 'Lean' | 'OK';
  volatileBurningEfficiency: number;
  combustionHealthScore: number;
  efficiencyScore: number;
  riskLevel: number;
  flameLength_m: number;
  noxPpm: number;
  so2Ppm: number;
}

export interface KilnAnalysis {
  kilnOperatingState: string;
  flameTemperature_C: number;
  flameLength_m: number;
  flameStabilityIndex: number;
  thermalUniformity_percent: number;
  combustionEfficiency_percent: number;
  kilnHeatEfficiency_percent: number;
  specificHeatConsumption_kCalPerKgClinker: number;
  co_ppm: number;
  nox_ppm: number;
  so2_ppm: number;
  combustionHealthScore: number;
  operationalRiskLevel: number;
  primaryConcern: string;
  recommendedOperatorAction: string;
}


export interface Proposal {
  id: string;
  action: string;
  rationale: string;
  risk_level: 'low' | 'medium' | 'high';
  confidence: number;
  expected_energy_delta_kwh_ton: number;
  expected_quality_impact: 'negligible' | 'minor' | 'significant';
  safety_gate_decision: 'approved' | 'escalated' | 'rejected';
  safety_rejection_reason?: string;
  timestamp: string;
}

const generateMetricsPrompt = (visionLabels: string[]): string => {
  const labelContext = visionLabels.join(', ');
  return `As a cement plant operations expert, analyze the following flame characteristics detected from an image: "${labelContext}". Based on these labels, generate a plausible set of at least 10 operational metrics.

  Return the data as a single, minified JSON object. Do not include any text or markdown formatting before or after the JSON object.

  Example JSON structure:
  {"flameTemp":1850,"coreBrightness":0.9,"thermalUniformity":92,"turbulenceIndex":0.3,"fuelAirBalance":"OK","volatileBurningEfficiency":94,"combustionHealthScore":89,"efficiencyScore":91,"riskLevel":0.1,"flameLength_m":5.5,"noxPpm":210,"so2Ppm":150}

  Based on the labels "${labelContext}", generate the JSON object:`;
};

const generatePromptForRecommendation = (latestData: TelemetryData, visionLabels?: string[]): string => {
    const { kiln_temp_c, mill_power_kw, mill_throughput_tph } = latestData;
    let dataAnalysis = '';
    if (kiln_temp_c > 1500) dataAnalysis += 'Kiln temperature is high. ';
    // ... (rest of the analysis logic)
    let visionContext = '';
    if (visionLabels && visionLabels.length > 0) {
      visionContext = `The flame image analysis detected the following labels: ${visionLabels.join(', ')}.`;
    }
    return `As an expert in cement plant operations, provide 3 specific, actionable recommendations for the following situation.
- Kiln Temperature: ${kiln_temp_c.toFixed(2)}°C
- Mill Power: ${mill_power_kw.toFixed(2)} kW
- Mill Throughput: ${mill_throughput_tph.toFixed(2)} tph
- Vision Context: ${visionContext}

Return the data as a single, minified JSON object with three keys: "rec1", "rec2", and "rec3". Do not include any text or markdown formatting before or after the JSON object.

Example JSON structure:
{"rec1":"Recommendation 1 text.","rec2":"Recommendation 2 text.","rec3":"Recommendation 3 text."}

Based on the data, generate the JSON object:`;
};

const generatePromptForAgent = (goal: string, latestData: TelemetryData): string => {
  return `As an AI agent with the goal to "${goal}", analyze the following telemetry data and generate a single, specific, and actionable optimization proposal.
- Kiln Temperature: ${latestData.kiln_temp_c.toFixed(2)}°C
- Mill Power: ${latestData.mill_power_kw.toFixed(2)} kW
- Mill Throughput: ${latestData.mill_throughput_tph.toFixed(2)} tph
- Energy Efficiency: ${latestData.energy_per_ton_kwh.toFixed(2)} kWh/ton
- Separator Efficiency: ${(latestData.separator_efficiency * 100).toFixed(1)}%
- Thermal Substitution Rate: ${latestData.thermal_substitution_rate.toFixed(1)}%

Return the data as a single, minified JSON object that matches the Proposal interface. Do not include any text or markdown formatting before or after the JSON object.

Example JSON structure:
{"id":"prop-1678886400000","action":"Slightly reduce Mill Power by 20 kW","rationale":"The current mill power is slightly high for the throughput, leading to excess energy consumption. A small reduction will improve efficiency with negligible impact on quality.","risk_level":"low","confidence":0.95,"expected_energy_delta_kwh_ton":-1.5,"expected_quality_impact":"negligible","safety_gate_decision":"approved","timestamp":"2025-03-15T12:00:00Z"}

Based on the goal and data, generate the JSON object:`;
};

export const getFromGemini = async (prompt: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error fetching from Gemini SDK:', error);
    throw new Error('Failed to get a response from the AI model.');
  }
};

const generateKilnAnalysisPrompt = (visionResult: any): string => {
  // Extract relevant Vision signals
  const labels = visionResult.responses?.[0]?.labelAnnotations?.map((l: any) => l.description)?.join(', ') || 'N/A';

  const objects = visionResult.responses?.[0]?.localizedObjectAnnotations
    ?.map((o: any) => `${o.name}(${Math.round(o.score * 100)}%)`)
    ?.join(', ') || 'N/A';

  const dominantColors = visionResult.responses?.[0]?.imagePropertiesAnnotation?.dominantColors?.colors
    ?.slice(0, 3)
    ?.map((c: any) =>
      `rgb(${c.color.red},${c.color.green},${c.color.blue}):${(c.pixelFraction * 100).toFixed(1)}%`
    )
    ?.join(' | ') || 'N/A';

  const smokeLikelihood = visionResult.responses?.[0]?.safeSearchAnnotation?.smokeLikelihood || 'UNKNOWN';

  return `
You are a senior cement plant lime kiln / rotary cement kiln combustion and pyro-processing expert.

A kiln flame image has been analyzed using computer vision. The extracted visual indicators are:

• Visual Labels: ${labels}
• Detected Flame Objects: ${objects}
• Dominant Flame Colors & Intensity Distribution: ${dominantColors}
• Smoke / Obscuration Likelihood: ${smokeLikelihood}

Interpret these indicators as they would appear on a real cement plant burner camera and infer the current kiln combustion condition.

Generate:
1) A realistic kiln flame and combustion analysis
2) Key operational performance metrics
3) Actionable operator recommendations

Rules:
- Assume coal/petcoke firing with a calciner
- Align values with cement industry operating ranges
- Flame instability, uneven color distribution, or smoke implies efficiency loss and emissions risk
- Stable bright flame implies efficient heat transfer

Return ONLY a single, minified JSON object with NO additional text.

The JSON MUST contain:

{
  "kilnOperatingState": "string", "flameTemperature_C": "number", "flameLength_m": "number", "flameStabilityIndex": "number", "thermalUniformity_percent": "number", "combustionEfficiency_percent": "number", "kilnHeatEfficiency_percent": "number", "specificHeatConsumption_kCalPerKgClinker": "number", "co_ppm": "number", "nox_ppm": "number", "so2_ppm": "number", "combustionHealthScore": "number", "operationalRiskLevel": "number", "primaryConcern": "string", "recommendedOperatorAction": "string"
}

Constraints:
- flameTemperature_C: 1600–2000
- specificHeatConsumption_kCalPerKgClinker: 650–900
- percentages: 0–100
- operationalRiskLevel: 0 (low) → 1 (high)

Now generate the JSON based on the above vision indicators.
`;
};

export const getFlameMetricsFromAi = async (visionLabels: string[]): Promise<FlameAnalysis> => {
  const prompt = generateMetricsPrompt(visionLabels);
  const jsonString = await getFromGemini(prompt);
  try {
    const cleanedJsonString = jsonString.replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(cleanedJsonString);
  } catch (error) {
    console.error('Failed to parse JSON from Gemini metrics response:', error);
    throw new Error('The AI model returned an invalid data format for metrics.');
  }
};

export const getAiRecommendations = async (latestData: TelemetryData, visionLabels?: string[]): Promise<{ recommendations: string[] }> => {
  const prompt = generatePromptForRecommendation(latestData, visionLabels);
  const jsonString = await getFromGemini(prompt);
  try {
    // Clean potential markdown formatting
    const cleanedJsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedJsonString);

    // Extract recommendations from the parsed object, ensuring they are strings.
    const recommendations = Object.values(parsed).map(value => String(value));

    return { recommendations };
  } catch (error) {
    console.error('Failed to parse JSON from Gemini recommendations response:', error);
    throw new Error('The AI model returned an invalid data format for recommendations.');
  }
};

export const getKilnAnalysisFromAi = async (visionResult: any): Promise<KilnAnalysis> => {
  const prompt = generateKilnAnalysisPrompt(visionResult);
  const jsonString = await getFromGemini(prompt);
  try {
    const cleanedJsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJsonString);
  } catch (error) {
    console.error('Failed to parse JSON from Gemini kiln analysis response:', error);
    throw new Error('The AI model returned an invalid data format for kiln analysis.');
  }
};

export const getAgentProposal = async (goal: string, latestData: TelemetryData): Promise<Proposal> => {
  const prompt = generatePromptForAgent(goal, latestData);
  const jsonString = await getFromGemini(prompt);
  try {
    const cleanedJsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJsonString);
  } catch (error) {
    console.error('Failed to parse JSON from Gemini agent response:', error);
    throw new Error('The AI model returned an invalid data format for the agent proposal.');
  }
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const getGeminiChatResponse = async (history: ChatMessage[], latestData: TelemetryData | null): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

  let system_prompt = `You are an expert in cement plant operations. Your name is Gemini. You are an AI operations assistant. You can help users understand plant performance, explain optimization decisions, and answer questions about cement manufacturing processes. Be concise and clear in your answers.`;

  if (latestData) {
    system_prompt += `\n\nHere is the latest live telemetry data from the plant for your context:
- Kiln Temperature: ${latestData.kiln_temp_c.toFixed(2)}°C
- Mill Power: ${latestData.mill_power_kw.toFixed(2)} kW
- Mill Throughput: ${latestData.mill_throughput_tph.toFixed(2)} tph
- Energy Efficiency: ${latestData.energy_per_ton_kwh.toFixed(2)} kWh/ton
- Separator Efficiency: ${(latestData.separator_efficiency * 100).toFixed(1)}%
- Thermal Substitution Rate: ${latestData.thermal_substitution_rate.toFixed(1)}%
`;
  }

  const contents: Content[] = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const request = {
      contents: [
          {role: "user", parts: [{text: system_prompt}]},
          {role: "model", parts: [{text: "Understood. I am Gemini, an AI operations assistant for cement plants. I will use the live telemetry data you provided to answer your questions. How can I help you?"}]},
          ...contents
      ]
  };

  try {
    const result = await model.generateContent(request);
    const response = await result.response;
    return response.text();
  } catch(error) {
     console.error('Error fetching from Gemini SDK:', error);
    throw new Error('Failed to get a response from the AI model.');
  }
};
