import { Badge } from '@/components/ui/badge';
import { Shield, Database, Brain, Activity } from 'lucide-react';

const SystemHealth = () => {
  const services = [
    { name: 'Safety Gate', status: 'active', icon: Shield, color: 'text-success' },
    { name: 'BigQuery', status: 'active', icon: Database, color: 'text-success' },
    { name: 'Vertex AI', status: 'active', icon: Brain, color: 'text-success' },
    { name: 'Telemetry', status: 'active', icon: Activity, color: 'text-success' }
  ];

  return (
    <div className="flex items-center gap-4">
      {services.map((service, idx) => {
        const Icon = service.icon;
        return (
          <div key={idx} className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${service.color}`} />
            <span className="text-sm text-muted-foreground hidden lg:inline">
              {service.name}
            </span>
            <Badge variant="outline" className="text-xs">
              {service.status}
            </Badge>
          </div>
        );
      })}
    </div>
  );
};

export default SystemHealth;
