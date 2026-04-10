import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  BrainCircuit,
  AlertTriangle,
  Upload,
  AlertCircle,
} from "lucide-react";
import kilnFlameImage from "@/assets/kiln-flame.png";
import { analyzeImage } from "@/services/visionService";
import {
  getKilnAnalysisFromAi,
  KilnAnalysis,
} from "@/components/dashboard/vertexAiService";

type VisionAnalysisResults = any;

const KilnOperation = () => {
  const [analysis, setAnalysis] = useState<KilnAnalysis | null>(null);
  const [visionResults, setVisionResults] = useState<VisionAnalysisResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageToAnalyze, setImageToAnalyze] = useState<string>(kilnFlameImage);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a URL for the uploaded file to display it
      const newImageUrl = URL.createObjectURL(file);
      setImageToAnalyze(newImageUrl);
      // Reset previous analysis
      setAnalysis(null);
      setVisionResults(null);
      setError(null);
    }
  };

  const handleAnalyzeClick = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setVisionResults(null);

    try {
      const visionData = await analyzeImage(imageToAnalyze);
      setVisionResults(visionData);
      if (!visionData?.responses?.[0]?.labelAnnotations?.length) {
        throw new Error("Could not detect any features from the image. Please try a different one.");
      }

      const generatedMetrics = await getKilnAnalysisFromAi(visionData);
      console.log(generatedMetrics);
      setAnalysis(generatedMetrics);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred during analysis.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: number | undefined) => {
    if (risk === undefined) return "text-muted-foreground";
    if (risk < 0.3) return "text-success";
    if (risk < 0.6) return "text-warning";
    return "text-destructive";
  };

  const labels = visionResults?.responses?.[0]?.labelAnnotations;

  return (
    <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-alert flex items-center justify-center">
            <Flame className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Kiln Flame Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Upload an image and run AI analysis.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
            accept="image/*"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Image
          </Button>
          <Button onClick={handleAnalyzeClick} disabled={loading}>
            {loading ? (
              "Analyzing..."
            ) : (
              <>
                <BrainCircuit className="h-4 w-4 mr-2" /> Analyze Flame
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border-destructive/30">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <div>
            <h4 className="font-semibold text-destructive">Analysis Failed</h4>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border shadow-card">
            <img
              src={imageToAnalyze}
              alt="Kiln Flame"
              className="w-full h-auto object-cover"
            />
          </div>
          {labels && (
            <div>
              <h4 className="text-sm font-semibold mb-2">
                Detected Image Labels
              </h4>
              <div className="flex flex-wrap gap-2">
                {labels.map((label: any) => (
                  <Badge key={label.mid} variant="secondary">
                    {label.description} ({(label.score * 100).toFixed(1)}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {!analysis && !loading && !error && (
            <div className="h-full flex items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">
                Upload an image and click "Analyze Flame" to generate a full AI
                analysis.
              </p>
            </div>
          )}
          {loading && (
            <div className="h-full flex items-center justify-center text-center p-8">
              <p className="text-muted-foreground">
                Generating full AI analysis... This may take a moment.
              </p>
            </div>
          )}
          {analysis && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Flame Temp
                  </p>
                  <p className="text-2xl font-bold">{analysis.flameTemperature_C}°C</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Specific Heat
                  </p>
                  <p className="text-2xl font-bold">
                    {analysis.specificHeatConsumption_kCalPerKgClinker}
                    <span className="text-sm"> kCal/kg</span>
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-primary border border-success/20">
                  <p className="text-xs text-success-foreground/80 mb-1">
                    Combustion Health
                  </p>
                  <p className="text-2xl font-bold text-success-foreground">
                    {analysis.combustionHealthScore.toFixed(0)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-primary border border-primary/20">
                  <p className="text-xs text-primary-foreground/80 mb-1">
                    Kiln Heat Efficiency
                  </p>
                  <p className="text-2xl font-bold text-primary-foreground">
                    {analysis.kilnHeatEfficiency_percent.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Kiln Operating State
                  </p>
                  <p className="text-xl">{analysis.kilnOperatingState}</p>
                </div>
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  AI Recommended Action
                </h4>
                <div className="mt-2">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getRiskColor(analysis.operationalRiskLevel)} bg-muted`}>
                      !
                    </div>
                    <p className="text-sm text-foreground pt-0.5">{analysis.recommendedOperatorAction}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default KilnOperation;
