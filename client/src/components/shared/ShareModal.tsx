import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Copy, 
  Check, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Link as LinkIcon,
  QrCode,
  Share2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verificationUrl: string;
  title: string;
  description?: string; // Reserved for future use in share text
}

export function ShareModal({ 
  open, 
  onOpenChange, 
  verificationUrl, 
  title
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareText = `Check out my ${title} on TrustFi!`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied!',
      description: 'Verification link copied to clipboard',
    });
  };

  const handleSocialShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    const encodedUrl = encodeURIComponent(verificationUrl);
    const encodedText = encodeURIComponent(shareText);

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `trustfi-card-qr-${Date.now()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();

      toast({
        title: 'Downloaded!',
        description: 'QR code saved to your device',
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Your Card
          </DialogTitle>
          <DialogDescription>
            Share your reputation card with others to showcase your achievements
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">
              <LinkIcon className="w-4 h-4 mr-2" />
              Link
            </TabsTrigger>
            <TabsTrigger value="qr">
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </TabsTrigger>
            <TabsTrigger value="social">
              <Share2 className="w-4 h-4 mr-2" />
              Social
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Link</label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-muted rounded-md text-sm font-mono break-all">
                  {verificationUrl}
                </div>
              </div>
            </div>
            <Button 
              onClick={copyToClipboard} 
              className="w-full"
              variant={copied ? "default" : "outline"}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg border-2 border-muted">
                <QRCodeSVG 
                  id="qr-code-svg"
                  value={verificationUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scan this QR code to verify the card on any device
              </p>
              <Button onClick={downloadQRCode} variant="outline" className="w-full">
                <QrCode className="w-4 h-4 mr-2" />
                Download QR Code
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Share your achievement on social media
            </p>
            <Button 
              onClick={() => handleSocialShare('twitter')}
              variant="outline" 
              className="w-full justify-start gap-3"
            >
              <Twitter className="w-5 h-5 text-[#1DA1F2]" />
              Share on Twitter
            </Button>
            <Button 
              onClick={() => handleSocialShare('facebook')}
              variant="outline" 
              className="w-full justify-start gap-3"
            >
              <Facebook className="w-5 h-5 text-[#1877F2]" />
              Share on Facebook
            </Button>
            <Button 
              onClick={() => handleSocialShare('linkedin')}
              variant="outline" 
              className="w-full justify-start gap-3"
            >
              <Linkedin className="w-5 h-5 text-[#0A66C2]" />
              Share on LinkedIn
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
