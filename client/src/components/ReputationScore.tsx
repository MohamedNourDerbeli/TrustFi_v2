import { Card } from '@/components/ui/card';
import { TrendingUp, Award, Shield } from 'lucide-react';

interface ReputationScoreProps {
  score: number;
  totalCredentials: number;
  verifiedAchievements: number;
}

export default function ReputationScore({
  score,
  totalCredentials,
  verifiedAchievements,
}: ReputationScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-600';
    if (score >= 600) return 'text-blue-600';
    if (score >= 400) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <Card className="p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-primary/10 mb-4">
          <span className={`text-5xl font-bold ${getScoreColor(score)}`} data-testid="text-reputation-score">
            {score}
          </span>
        </div>
        <h3 className="text-2xl font-semibold">Reputation Score</h3>
        <p className="text-sm text-muted-foreground mt-1">Your trust level on the blockchain</p>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-6 border-t">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <Award className="w-5 h-5 text-primary" />
          </div>
          <div className="text-2xl font-bold" data-testid="text-total-credentials">{totalCredentials}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Credentials</div>
        </div>
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="text-2xl font-bold" data-testid="text-verified-achievements">{verifiedAchievements}</div>
          <div className="text-xs text-muted-foreground mt-1">Verified</div>
        </div>
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-green-600">+12%</div>
          <div className="text-xs text-muted-foreground mt-1">This Month</div>
        </div>
      </div>
    </Card>
  );
}
