import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3,
  TrendingUp,
  Users,
  Download,
  Loader2,
  Calendar,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import type { CollectibleTemplate, CollectibleAnalytics as Analytics } from '@/types/collectible';

interface CollectibleAnalyticsProps {
  template: CollectibleTemplate;
  analytics: Analytics | null;
  loading?: boolean;
  onExport?: () => void;
}

export function CollectibleAnalytics({
  template,
  analytics,
  loading,
  onExport,
}: CollectibleAnalyticsProps) {
  const [claimVelocity, setClaimVelocity] = useState<string>('0');

  useEffect(() => {
    if (!analytics || analytics.claimTimeline.length === 0) {
      setClaimVelocity('0');
      return;
    }

    // Calculate claims per day
    const timeline = analytics.claimTimeline;
    const firstClaim = timeline[0].timestamp;
    const lastClaim = timeline[timeline.length - 1].timestamp;
    const daysDiff = (lastClaim - firstClaim) / (1000 * 60 * 60 * 24);

    if (daysDiff === 0) {
      setClaimVelocity(`${timeline.length} per day`);
    } else {
      const claimsPerDay = timeline.length / daysDiff;
      if (claimsPerDay < 1) {
        const claimsPerHour = timeline.length / (daysDiff * 24);
        setClaimVelocity(`${claimsPerHour.toFixed(2)} per hour`);
      } else {
        setClaimVelocity(`${claimsPerDay.toFixed(2)} per day`);
      }
    }
  }, [analytics]);

  const handleExportCSV = () => {
    if (!analytics || !onExport) return;

    const csvContent = [
      ['Address', 'Timestamp', 'Transaction Hash'],
      ...analytics.claimTimeline.map((claim) => [
        claim.claimer,
        new Date(claim.timestamp).toISOString(),
        claim.txHash,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collectible-${template.templateId}-claims.csv`;
    a.click();
    URL.revokeObjectURL(url);

    onExport();
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No analytics available</p>
          <p className="text-sm">Analytics will appear once claims are made</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Collectible #{template.templateId} - {template.category}
          </p>
        </div>
        {analytics.claimTimeline.length > 0 && (
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Claims</span>
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold">{analytics.totalClaims}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {analytics.uniqueClaimers.length} unique claimers
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Claim Velocity</span>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold">{claimVelocity}</div>
          <p className="text-xs text-muted-foreground mt-1">Average claim rate</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Supply Used</span>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold">
            {template.maxSupply === 0 ? '∞' : `${analytics.supplyPercentage.toFixed(1)}%`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {template.maxSupply === 0
              ? 'Unlimited supply'
              : `${template.maxSupply - template.currentSupply} remaining`}
          </p>
        </Card>
      </div>

      {/* Supply Progress */}
      {template.maxSupply > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Supply Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {template.currentSupply} / {template.maxSupply} claimed
              </span>
              <span className="font-medium">{analytics.supplyPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={analytics.supplyPercentage} className="h-3" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </Card>
      )}

      {/* Claim Timeline */}
      {analytics.claimTimeline.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Claims</h3>
          <div className="space-y-3">
            {analytics.claimTimeline.slice(-10).reverse().map((claim, index) => (
              <div key={index}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono text-xs">
                        {claim.claimer.slice(0, 6)}...{claim.claimer.slice(-4)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(claim.timestamp), 'PPp')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://etherscan.io/tx/${claim.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
                      >
                        {claim.txHash.slice(0, 10)}...{claim.txHash.slice(-8)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {Math.floor((Date.now() - claim.timestamp) / (1000 * 60 * 60))}h ago
                    </span>
                  </div>
                </div>
                {index < analytics.claimTimeline.slice(-10).length - 1 && (
                  <Separator className="mt-3" />
                )}
              </div>
            ))}
          </div>
          {analytics.claimTimeline.length > 10 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Showing 10 most recent claims of {analytics.claimTimeline.length} total
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Time-based Stats */}
      {template.startTime > 0 || template.endTime > 0 ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Time Window</h3>
          <div className="space-y-3">
            {template.startTime > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Start Time</span>
                </div>
                <span className="text-sm font-medium">
                  {format(new Date(template.startTime * 1000), 'PPp')}
                </span>
              </div>
            )}
            {template.endTime > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>End Time</span>
                </div>
                <span className="text-sm font-medium">
                  {format(new Date(template.endTime * 1000), 'PPp')}
                </span>
              </div>
            )}
            {template.endTime > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span>Time Remaining</span>
                </div>
                <span className="text-sm font-medium">
                  {template.endTime * 1000 > Date.now()
                    ? `${Math.floor((template.endTime * 1000 - Date.now()) / (1000 * 60 * 60 * 24))} days`
                    : 'Expired'}
                </span>
              </div>
            )}
          </div>
        </Card>
      ) : null}

      {/* Empty State */}
      {analytics.totalClaims === 0 && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No claims yet</p>
            <p className="text-sm">Analytics will appear once users start claiming</p>
          </div>
        </Card>
      )}
    </div>
  );
}
