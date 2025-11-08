import { Card } from '@/components/ui/card';
import { Shield, Award, UserPlus } from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 'credential' | 'achievement' | 'profile';
  title: string;
  description: string;
  timestamp: string;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
}

const getEventIcon = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'credential':
      return Shield;
    case 'achievement':
      return Award;
    case 'profile':
      return UserPlus;
  }
};

export default function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-6">Recent Activity</h3>
      <div className="space-y-6">
        {events.map((event, index) => {
          const Icon = getEventIcon(event.type);
          return (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                {index < events.length - 1 && (
                  <div className="w-0.5 h-full bg-border mt-2" />
                )}
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <h4 className="font-semibold">{event.title}</h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
