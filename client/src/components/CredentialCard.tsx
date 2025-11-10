import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Calendar, User } from 'lucide-react';
import { MintingModeBadge } from '@/components/shared/MintingModeBadge';
import { MintingMode } from '@/types/collectible';

export interface CredentialCardData {
  id: string;
  title: string;
  issuer: string;
  issuerAddress: string;
  description: string;
  issuedDate: string;
  category: string;
  verified: boolean;
  mintingMode?: MintingMode;
  templateId?: number;
}

interface CredentialCardProps {
  credential: CredentialCardData;
  onClick?: () => void;
}

export default function CredentialCard({ credential, onClick }: CredentialCardProps) {
  const truncateAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <Card
      className="p-6 hover-elevate cursor-pointer transition-all duration-200 border-2"
      onClick={onClick}
      data-testid={`card-credential-${credential.id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" data-testid="badge-category">
            {credential.category}
          </Badge>
          {credential.mintingMode !== undefined && (
            <MintingModeBadge 
              mintingMode={credential.mintingMode} 
              size="sm"
              showIcon={false}
            />
          )}
        </div>
        {credential.verified && (
          <div className="flex items-center gap-1 text-primary">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-medium">Verified</span>
          </div>
        )}
      </div>

      <h3 className="text-xl font-semibold mb-2" data-testid="text-credential-title">
        {credential.title}
      </h3>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {credential.description}
      </p>

      <div className="space-y-2 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{credential.issuer}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono text-xs">{truncateAddress(credential.issuerAddress)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{new Date(credential.issuedDate).toLocaleDateString()}</span>
        </div>
      </div>
    </Card>
  );
}
