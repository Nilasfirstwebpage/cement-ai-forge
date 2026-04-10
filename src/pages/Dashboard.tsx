import { useState, useEffect } from 'react';
import { onLatestTelemetryUpdate, TelemetryData } from '@/pages/firestoreService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TelemetryDashboard from '@/components/dashboard/TelemetryDashboard';
import OptimizationPanel from '@/components/dashboard/OptimizationPanel';
import { useTelemetry } from '@/hooks/useTelemetry';

const Dashboard = () => {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { latestData, history, loading } = useTelemetry();

  useEffect(() => {
    const unsubscribe = onLatestTelemetryUpdate((latestData: TelemetryData | null) => {
      if (latestData && latestData.createdAt) {
        const timestamp = latestData.createdAt.toDate();
        setLastUpdated(timestamp);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <Tabs defaultValue="telemetry" className="space-y-4">
      <TabsList>
        <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
        <TabsTrigger value="ai-optimization">AI Optimization</TabsTrigger>
      </TabsList>
      <TabsContent value="telemetry">
        <TelemetryDashboard
          latestData={latestData}
          trends={null}
          loading={loading}
          history={history}
        />
      </TabsContent>
      <TabsContent value="ai-optimization">
        <OptimizationPanel />
      </TabsContent>
    </Tabs>
  );
};

export default Dashboard;

export default Dashboard;