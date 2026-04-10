import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Brain,
  Shield,
  Zap,
  TrendingUp,
  Network,
} from "lucide-react";
import { addTelemetryData } from "@/pages/firestoreService";
import {
  onLatestTelemetryUpdate,
  TelemetryData,
} from "@/pages/firestoreService";
const Home = () => {
  const navigate = useNavigate();
  const features = [
    {
      icon: Activity,
      title: "Real-Time Telemetry",
      description:
        "Monitor live plant operations with millisecond precision across all production stages.",
      color: "text-primary",
    },
    {
      icon: Brain,
      title: "GenAI Optimization",
      description:
        "Leverage Google Gemini and Vertex AI for autonomous process optimization and predictive control.",
      color: "text-success",
    },
    {
      icon: Shield,
      title: "Safety Gate",
      description:
        "Multi-layered safety validation ensures all AI recommendations meet operational constraints.",
      color: "text-destructive",
    },
    {
      icon: Zap,
      title: "Energy Efficiency",
      description:
        "Reduce energy consumption by up to 15% through intelligent fuel mix and process optimization.",
      color: "text-warning",
    },
    {
      icon: TrendingUp,
      title: "Quality Consistency",
      description:
        "Maintain target clinker quality with predictive models and real-time adjustments.",
      color: "text-secondary",
    },
    {
      icon: Network,
      title: "Multi-Agent System",
      description:
        "Orchestrated AI agents for data ingestion, vision analysis, optimization, and operator assistance.",
      color: "text-accent",
    },
  ];

  const [latestData, setLatestData] = useState<TelemetryData | null>(null);

  useEffect(() => {
    // Helper to create small variations for the next data point
    const getNextValue = (current: number, variation: number) => {
      return current + (Math.random() - 0.5) * variation;
    };

    const addData = (latestData: TelemetryData | null) => {
      try {
        // Use previous data as a baseline, or create a default starting point
        const baseline = latestData || {
          kiln_temp_c: 1410,
          energy_per_ton_kwh: 95,
          mill_power_kw: 1250,
          mill_throughput_tph: 85,
          thermal_substitution_rate: 30,
          separator_efficiency: 0.85,
          raw_caO: 62.5,
          raw_siO2: 21.0,
          raw_al2O3: 5.5,
          raw_fe2O3: 3.2,
          timestamp: new Date(),
        };

        // Generate the next data point based on the baseline
        const sampleData = {
          kiln_temp_c: getNextValue(baseline.kiln_temp_c, 10), // Varies by +/- 5
          energy_per_ton_kwh: getNextValue(baseline.energy_per_ton_kwh, 2),
          mill_power_kw: getNextValue(baseline.mill_power_kw, 50),
          mill_throughput_tph: getNextValue(baseline.mill_throughput_tph, 5),
          thermal_substitution_rate: getNextValue(
            baseline.thermal_substitution_rate,
            2
          ),
          separator_efficiency: getNextValue(
            baseline.separator_efficiency,
            0.02
          ),
          raw_caO: getNextValue(baseline.raw_caO, 1),
          raw_siO2: getNextValue(baseline.raw_siO2, 0.5),
          raw_al2O3: getNextValue(baseline.raw_al2O3, 0.2),
          raw_fe2O3: getNextValue(baseline.raw_fe2O3, 0.2),
          fuel_mix: JSON.stringify([
            { fuel: "coal", "%": getNextValue(65, 5).toFixed(1) },
            { fuel: "biomass", "%": getNextValue(22, 3).toFixed(1) },
            { fuel: "alternative", "%": getNextValue(8, 2).toFixed(1) },
          ]),
          timestamp: new Date().toISOString(), // Convert Date to ISO string for Firestore
        };

        addTelemetryData(sampleData).then((docRef) => {
          console.log(
            `Telemetry data automatically added with ID: ${docRef.id}`
          );
        });
      } catch (error) {
        console.error("Error automatically adding telemetry data: ", error);
      }
    };

    const intervalId = setInterval(() => addData(latestData), 10 * 1000); // 10 seconds

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [latestData]); // This effect now re-runs whenever latestData changes

  useEffect(() => {
    // Set up a listener to get the latest data for our simulation baseline
    const unsubscribe = onLatestTelemetryUpdate(setLatestData);

    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto">
          <div className="flex justify-center">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Activity className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              Cement Plant AI Operations
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              GenAI-Powered Autonomous Optimization Platform
            </p>
          </div>

          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A cutting-edge prototype leveraging{" "}
            <span className="text-primary font-medium">Google Cloud AI</span>,
            <span className="text-primary font-medium"> Confluent Cloud </span>,
            <span className="text-primary font-medium"> Gemini</span>,
            <span className="text-primary font-medium"> Vertex AI</span>, and
            <span className="text-primary font-medium"> Cloud Vision</span> to
            revolutionize cement manufacturing through intelligent automation,
            predictive analytics, and real-time optimization.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
            >
              Launch Dashboard
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.open("https://docs.google.com", "_blank")}
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
            >
              View Documentation
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-4 sm:p-6 hover:shadow-elevated transition-shadow duration-300 border-border/50"
              >
                <div className="space-y-3 sm:space-y-4">
                  <div
                    className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-muted flex items-center justify-center ${feature.color}`}
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Technology Stack */}
        <Card className="mt-12 sm:mt-20 p-6 sm:p-8 bg-gradient-surface border-border/50">
          <div className="text-center space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Powered by Google Cloud AI
            </h2>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-background rounded-full border border-border">
                Confluent
              </span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-background rounded-full border border-border">
                Gemini 2.5 Pro
              </span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-background rounded-full border border-border">
                Vertex AI
              </span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-background rounded-full border border-border">
                Cloud Vision
              </span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-background rounded-full border border-border">
                BigQuery
              </span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-background rounded-full border border-border">
                Agent Builder
              </span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-background rounded-full border border-border">
                Firebase
              </span>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-border/50">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Prototype • Project ID: still-manifest-466507-k0 • Region:
            asia-south1
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
