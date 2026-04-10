import { Badge } from "@/components/ui/badge";
import { Shield, Database, Brain, Activity } from "lucide-react";

const SystemHealth = () => {
  const services = [
    {
      name: "Telemetry",
      status: "active",
      icon: Activity,
      color: "text-success",
    },
    {
      name: "Optimization",
      status: "active",
      icon: Brain,
      color: "text-success",
    },

    {
      name: "Safety Gate",
      status: "active",
      icon: Shield,
      color: "text-success",
    },
    {
      name: "AI Analytics",
      status: "active",
      icon: Database,
      color: "text-success",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
      {services.map((service, idx) => {
        const Icon = service.icon;
        return (
          <div key={idx} className="flex items-center gap-1.5 sm:gap-2">
            <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${service.color}`} />
            <span className="text-xs sm:text-sm text-muted-foreground hidden md:inline">
              {service.name}
            </span>
            <Badge variant="outline" className="text-[10px] sm:text-xs">
              {service.status}
            </Badge>
          </div>
        );
      })}
    </div>
  );
};

export default SystemHealth;
