import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { contractService } from '@/services/contractService';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, Zap, Award, AlertCircle } from 'lucide-react';

interface ActivateProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function ActivateProfileDialog({ 
  open, 
  onOpenChange,
  onSuccess 
}: ActivateProfileDialogProps) {
  const [isActivating, setIsActivating] = useState(false);
  const { provider, address, refreshProfile } = useWallet();
  const { toast } = useToast();

  const handleActivate = async () => {
    if (!provider || !address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsActivating(true);

      // Initialize contract service
      if (!contractService.isInitialized()) {
        await contractService.initialize(provider);
      }

      // Check if profile already exists
      try {
        const existingProfile = await contractService.getProfileByOwner(address);
        if (existingProfile) {
          toast({
            title: 'Profile Already Exists',
            description: 'You already have an active profile',
          });
          await refreshProfile();
          onOpenChange(false);
          onSuccess?.();
          return;
        }
      } catch (err: any) {
        if (!err.message?.includes('Profile not found')) {
          console.error('Error checking profile:', err);
        }
      }

      // Create simple metadata
      const metadata = {
        name: `User ${address.slice(0, 6)}`,
        description: 'TrustFi Profile',
      };

      const metadataURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;

      // Set status to pending immediately
      const { profileService } = await import('@/services/profileService');
      await profileService.updateActivationStatus(address, 'pending');

      // Invalidate cache immediately to show pending status
      const { queryClient } = await import('@/lib/queryClient');
      await queryClient.invalidateQueries({ queryKey: ['profile', 'offchain', address.toLowerCase()] });

      toast({
        title: 'Confirm Transaction',
        description: 'Please confirm the transaction in your wallet',
      });

      // Close dialog immediately - don't make user wait
      onOpenChange(false);

      toast({
        title: 'Transaction Submitted!',
        description: 'Your profile is being activated. You can continue using the app.',
      });

      // Create on-chain profile in background
      try {
        await contractService.createProfile(metadataURI);

        // Update status to active
        await profileService.updateActivationStatus(address, 'active');

        // Invalidate React Query cache
        await queryClient.invalidateQueries({ queryKey: ['profile', 'offchain', address.toLowerCase()] });

        toast({
          title: 'Profile Activated!',
          description: 'You can now receive reputation cards and mint credentials',
        });

        // Refresh profile
        await refreshProfile();
        
        onSuccess?.();
      } catch (bgError: any) {
        console.error('Background activation error:', bgError);
        
        // Update status to failed
        await profileService.updateActivationStatus(address, 'failed');
        await queryClient.invalidateQueries({ queryKey: ['profile', 'offchain', address.toLowerCase()] });
        
        toast({
          title: 'Activation Failed',
          description: 'The transaction failed. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Activation error:', error);
      
      // Update status to failed if transaction was submitted
      if (address && !error.message?.includes('user rejected') && error.code !== 'ACTION_REJECTED') {
        try {
          const { profileService } = await import('@/services/profileService');
          await profileService.updateActivationStatus(address, 'failed');
          
          // Invalidate cache
          const { queryClient } = await import('@/lib/queryClient');
          await queryClient.invalidateQueries({ queryKey: ['profile', 'offchain', address.toLowerCase()] });
        } catch (updateError) {
          console.error('Failed to update status:', updateError);
        }
      }
      
      if (error.message?.includes('ProfileAlreadyExists')) {
        toast({
          title: 'Profile Already Exists',
          description: 'You already have an active profile',
        });
        await refreshProfile();
        onOpenChange(false);
        onSuccess?.();
      } else if (error.message?.includes('user rejected') || error.code === 'ACTION_REJECTED') {
        toast({
          title: 'Transaction Cancelled',
          description: 'You cancelled the transaction',
          variant: 'destructive',
        });
      } else if (error.message?.includes('insufficient funds')) {
        toast({
          title: 'Insufficient Funds',
          description: 'You need ETH to pay for gas fees',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Activation Failed',
          description: error.message || 'Failed to activate profile. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Activate Your Profile
          </DialogTitle>
          <DialogDescription>
            Activate your on-chain profile to unlock all features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">One-time activation</p>
                <p className="text-xs text-muted-foreground">
                  Creates your profile NFT on the blockchain
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Receive credentials</p>
                <p className="text-xs text-muted-foreground">
                  Get reputation cards from verified issuers
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-xs text-yellow-600">
                <p className="font-medium">Gas fee required</p>
                <p>You'll need to pay a one-time gas fee to create your profile NFT</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isActivating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleActivate}
            disabled={isActivating}
          >
            {isActivating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Activating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Activate Profile
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
