import { Card } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface HowItWorksCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  step: number;
}

export default function HowItWorksCard({ icon: Icon, title, description, step }: HowItWorksCardProps) {
  return (
    <Card className="p-8 text-center relative">
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
          {step}
        </div>
      </div>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 mt-2">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  );
}
