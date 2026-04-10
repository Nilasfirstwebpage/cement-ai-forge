import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { BrainCircuit } from 'lucide-react';
import { TelemetryData } from '@/pages/firestoreService';
import { getAiRecommendations } from './vertexAiService';

interface AIRecommendationsProps {
  latestData: TelemetryData | null;
}

const AIRecommendations = ({ latestData }: AIRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to hold the latestData to avoid stale closures in setInterval
  const latestDataRef = useRef(latestData);
  useEffect(() => {
    latestDataRef.current = latestData;
  }, [latestData]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      // Only fetch if there is data available
      if (latestDataRef.current) {
        setLoading(true);
        setError(null);
        try {
          const result = await getAiRecommendations(latestDataRef.current);
          setRecommendations(result.recommendations || []);
        } catch (err: any) {
          setError(err.message);
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    // Fetch recommendations immediately on component mount
    fetchRecommendations();

    // Then fetch recommendations every 3 minutes
    const intervalId = setInterval(fetchRecommendations, 3 * 60 * 1000); // 3 minutes in milliseconds

    // Clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures this effect runs only once on mount

  return (
    <Card className="p-4 sm:p-6 bg-gradient-surface border-border">
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
        <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        AI Recommendations
      </h3>
      {loading && <p className="text-sm text-muted-foreground">Generating insights...</p>}
      {error && <p className="text-sm text-destructive">Error: {error}</p>}
      {!loading && !error && recommendations.length > 0 && (
        <ul className="space-y-2 text-sm text-foreground list-disc pl-5">
          {recommendations.map((rec, index) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default AIRecommendations;