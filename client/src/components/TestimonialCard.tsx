import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  company: string;
  rating?: number;
}

export default function TestimonialCard({
  quote,
  author,
  role,
  company,
  rating = 5,
}: TestimonialCardProps) {
  const initials = author
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-primary text-primary" />
        ))}
      </div>
      <p className="text-muted-foreground mb-6 flex-1">"{quote}"</p>
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold">{author}</div>
          <div className="text-sm text-muted-foreground">
            {role} at {company}
          </div>
        </div>
      </div>
    </Card>
  );
}
