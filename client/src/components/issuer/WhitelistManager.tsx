import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, Plus, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ethers } from 'ethers';

interface WhitelistManagerProps {
  templateId: number;
  isOpen: boolean;
  onClose: () => void;
  onAddAddresses: (templateId: number, addresses: string[]) => Promise<void>;
  onRemoveAddresses: (templateId: number, addresses: string[]) => Promise<void>;
}

export function WhitelistManager({
  templateId,
  isOpen,
  onClose,
  onAddAddresses,
  onRemoveAddresses,
}: WhitelistManagerProps) {
  const { toast } = useToast();
  const [bulkAddresses, setBulkAddresses] = useState('');
  const [singleAddress, setSingleAddress] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateAddresses = (addresses: string[]): { valid: string[]; invalid: string[] } => {
    const valid: string[] = [];
    const invalid: string[] = [];

    addresses.forEach((addr) => {
      const trimmed = addr.trim();
      if (trimmed && ethers.isAddress(trimmed)) {
        valid.push(trimmed);
      } else if (trimmed) {
        invalid.push(trimmed);
      }
    });

    return { valid, invalid };
  };

  const handleBulkAdd = async () => {
    const addresses = bulkAddresses
      .split('\n')
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);

    if (addresses.length === 0) {
      toast({
        title: 'No Addresses',
        description: 'Please enter at least one address',
        variant: 'destructive',
      });
      return;
    }

    const { valid, invalid } = validateAddresses(addresses);

    if (invalid.length > 0) {
      setValidationErrors(invalid);
      toast({
        title: 'Invalid Addresses',
        description: `${invalid.length} invalid address(es) found. Please correct them.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsAdding(true);
      setValidationErrors([]);
      await onAddAddresses(templateId, valid);
      
      toast({
        title: 'Addresses Added',
        description: `Successfully added ${valid.length} address(es) to whitelist`,
      });
      
      setBulkAddresses('');
    } catch (error: any) {
      toast({
        title: 'Failed to Add',
        description: error.message || 'Failed to add addresses to whitelist',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleSingleAdd = async () => {
    const trimmed = singleAddress.trim();
    
    if (!trimmed) {
      toast({
        title: 'No Address',
        description: 'Please enter an address',
        variant: 'destructive',
      });
      return;
    }

    if (!ethers.isAddress(trimmed)) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid Ethereum address',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsAdding(true);
      await onAddAddresses(templateId, [trimmed]);
      
      toast({
        title: 'Address Added',
        description: 'Successfully added address to whitelist',
      });
      
      setSingleAddress('');
    } catch (error: any) {
      toast({
        title: 'Failed to Add',
        description: error.message || 'Failed to add address to whitelist',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleBulkRemove = async () => {
    const addresses = bulkAddresses
      .split('\n')
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);

    if (addresses.length === 0) {
      toast({
        title: 'No Addresses',
        description: 'Please enter at least one address to remove',
        variant: 'destructive',
      });
      return;
    }

    const { valid, invalid } = validateAddresses(addresses);

    if (invalid.length > 0) {
      setValidationErrors(invalid);
      toast({
        title: 'Invalid Addresses',
        description: `${invalid.length} invalid address(es) found. Please correct them.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsRemoving(true);
      setValidationErrors([]);
      await onRemoveAddresses(templateId, valid);
      
      toast({
        title: 'Addresses Removed',
        description: `Successfully removed ${valid.length} address(es) from whitelist`,
      });
      
      setBulkAddresses('');
    } catch (error: any) {
      toast({
        title: 'Failed to Remove',
        description: error.message || 'Failed to remove addresses from whitelist',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Manage Whitelist - Collectible #{templateId}
          </DialogTitle>
          <DialogDescription>
            Add or remove addresses from the whitelist. Only whitelisted addresses will be able to claim this collectible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Single Address Input */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Single Address
            </h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="0x..."
                  value={singleAddress}
                  onChange={(e) => setSingleAddress(e.target.value)}
                  disabled={isAdding || isRemoving}
                />
              </div>
              <Button
                onClick={handleSingleAdd}
                disabled={isAdding || isRemoving || !singleAddress.trim()}
              >
                {isAdding ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </Card>

          {/* Bulk Operations */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Bulk Operations</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="bulk-addresses">
                  Addresses (one per line)
                </Label>
                <Textarea
                  id="bulk-addresses"
                  placeholder="0x1234...&#10;0x5678...&#10;0xabcd..."
                  value={bulkAddresses}
                  onChange={(e) => {
                    setBulkAddresses(e.target.value);
                    setValidationErrors([]);
                  }}
                  rows={8}
                  className="font-mono text-sm"
                  disabled={isAdding || isRemoving}
                />
                {validationErrors.length > 0 && (
                  <div className="mt-2 p-3 bg-destructive/10 border border-destructive rounded-md">
                    <p className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Invalid Addresses:
                    </p>
                    <ul className="text-xs text-destructive space-y-1 font-mono">
                      {validationErrors.slice(0, 5).map((addr, i) => (
                        <li key={i}>• {addr}</li>
                      ))}
                      {validationErrors.length > 5 && (
                        <li>... and {validationErrors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleBulkAdd}
                  disabled={isAdding || isRemoving || !bulkAddresses.trim()}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isAdding ? 'Adding...' : 'Add All'}
                </Button>
                <Button
                  onClick={handleBulkRemove}
                  disabled={isAdding || isRemoving || !bulkAddresses.trim()}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isRemoving ? 'Removing...' : 'Remove All'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold">Tips:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Addresses must be valid Ethereum addresses (0x...)</li>
                  <li>Duplicate addresses will be ignored</li>
                  <li>Changes take effect immediately on-chain</li>
                  <li>Gas fees apply for each transaction</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAdding || isRemoving}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
