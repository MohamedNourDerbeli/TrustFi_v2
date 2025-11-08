import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import WalletConnectButton from '@/components/WalletConnectButton';
import ThemeToggle from '@/components/ThemeToggle';
import HowItWorksCard from '@/components/HowItWorksCard';
import FeatureSection from '@/components/FeatureSection';
import TestimonialCard from '@/components/TestimonialCard';
import StatCard from '@/components/StatCard';
import { UserPlus, Award, Shield, Users, Building2, Sparkles } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useProfile } from '@/contexts/ProfileContext';
import heroImage from '@assets/generated_images/Hero_blockchain_network_visualization_bb3439b1.png';
import educationImage from '@assets/generated_images/Education_credential_certificate_1c181217.png';
import corporateImage from '@assets/generated_images/Corporate_professional_workplace_15ea9504.png';
import freelanceImage from '@assets/generated_images/Freelancer_home_workspace_ec9add6f.png';
import web3Image from '@assets/generated_images/Web3_community_collaboration_cd6cb4dc.png';

export default function Home() {
  const { connectWallet, userProfile, connected, address } = useWallet();
  const { offChainData } = useProfile();

  const handleCreateProfileClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If already connected, go to profile page
    if (connected) {
      if (offChainData?.username) {
        window.location.href = `/${offChainData.username}`;
      } else if (address) {
        window.location.href = `/${address}`;
      } else {
        window.location.href = '/dashboard';
      }
      return;
    }
    
    // Connect wallet and go to profile
    const result = await connectWallet();
    if (result && result.address) {
      window.location.href = `/${result.address}`;
    }
  };

  // Determine button text based on connection and profile status
  const getButtonText = () => {
    if (!connected) {
      return 'Create Profile';
    }
    // Check both on-chain and off-chain profile
    if (userProfile?.hasProfile || offChainData) {
      return 'Go to Profile';
    }
    return 'Create Profile';
  };
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold">TrustFi</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#how-it-works" className="text-sm font-medium hover-elevate px-3 py-2 rounded-md">
                How It Works
              </a>
              <a href="#use-cases" className="text-sm font-medium hover-elevate px-3 py-2 rounded-md">
                Use Cases
              </a>
              <a href="#testimonials" className="text-sm font-medium hover-elevate px-3 py-2 rounded-md">
                Testimonials
              </a>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </header>

      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            Own Your Reputation.<br />
            <span className="text-primary">Verify Your Trust.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Build verifiable credentials on the blockchain. Your achievements, permanently secured and instantly verified.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 backdrop-blur-md" 
              data-testid="button-create-profile"
              onClick={handleCreateProfileClick}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              {getButtonText()}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 backdrop-blur-md bg-background/20"
              data-testid="button-view-demo"
            >
              View Demo
            </Button>
          </div>
          <div className="mt-12 text-white/80">
            <p className="text-sm font-medium mb-2">Trusted by leading organizations</p>
            <div className="flex items-center justify-center gap-8 text-sm">
              <span>50+ Universities</span>
              <span>•</span>
              <span>200+ Companies</span>
              <span>•</span>
              <span>10K+ Users</span>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to build your on-chain reputation
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <HowItWorksCard
              step={1}
              icon={UserPlus}
              title="Create Profile"
              description="Connect your wallet and create your unique on-chain reputation profile in seconds"
            />
            <HowItWorksCard
              step={2}
              icon={Award}
              title="Earn Credentials"
              description="Receive verifiable NFT credentials from authorized issuers for your achievements"
            />
            <HowItWorksCard
              step={3}
              icon={Shield}
              title="Verify Anywhere"
              description="Share your credentials with anyone, instantly verifiable on the blockchain"
            />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Credentials" value="24,589" icon={Award} trend="+12%" trendUp />
            <StatCard title="Active Users" value="10,234" icon={Users} trend="+8%" trendUp />
            <StatCard title="Organizations" value="250" icon={Building2} trend="+15%" trendUp />
            <StatCard title="Verified Issuers" value="156" icon={Shield} trend="+10%" trendUp />
          </div>
        </div>
      </section>

      <section id="use-cases" className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">Use Cases</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transforming credentials across industries
            </p>
          </div>

          <FeatureSection
            title="Higher Education"
            description="Transform how universities issue and verify degrees, certificates, and academic achievements with blockchain-based credentials."
            imageSrc={educationImage}
            imageAlt="Education credentials"
            features={[
              'Instant degree verification for employers',
              'Eliminate transcript requests and save time',
              'Prevent diploma fraud with blockchain verification',
              'Modern, tech-forward brand image',
            ]}
          />

          <FeatureSection
            title="Corporate HR & Recruiting"
            description="Streamline hiring with instant credential verification, reduce background check costs, and prevent resume fraud."
            imageSrc={corporateImage}
            imageAlt="Corporate workspace"
            imageRight
            features={[
              'Reduce verification time from weeks to seconds',
              'Cut background check costs by 70%',
              'Prevent resume fraud and false credentials',
              'Streamline the entire hiring process',
            ]}
          />

          <FeatureSection
            title="Freelance & Gig Economy"
            description="Build your reputation once and use it everywhere. No more starting from zero on every new platform."
            imageSrc={freelanceImage}
            imageAlt="Freelancer workspace"
            features={[
              'Portable reputation across all platforms',
              'Verifiable work history and achievements',
              'Competitive advantage in the gig economy',
              'Platform-independent trust score',
            ]}
          />

          <FeatureSection
            title="Web3 Communities & DAOs"
            description="Native blockchain integration for DAO memberships, governance participation, and community achievements."
            imageSrc={web3Image}
            imageAlt="Web3 community"
            imageRight
            features={[
              'DAO membership credentials',
              'Governance participation badges',
              'Community achievement tracking',
              'Composable on-chain reputation',
            ]}
          />
        </div>
      </section>

      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">What People Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Trusted by professionals and organizations worldwide
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="TrustFi has revolutionized how we verify credentials. What used to take weeks now happens instantly."
              author="Sarah Chen"
              role="HR Director"
              company="TechCorp"
              rating={5}
            />
            <TestimonialCard
              quote="As a freelancer, having a portable reputation across platforms has been a game-changer for my career."
              author="Marcus Rodriguez"
              role="Full Stack Developer"
              company="Independent"
              rating={5}
            />
            <TestimonialCard
              quote="Our university can now issue fraud-proof digital diplomas. Students love the modern approach."
              author="Dr. Emily Watson"
              role="Dean of Students"
              company="State University"
              rating={5}
            />
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Build Your Reputation?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Join thousands of users building verifiable trust on the blockchain
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8" 
              data-testid="button-get-started"
              onClick={handleCreateProfileClick}
            >
              {connected && (userProfile?.hasProfile || offChainData) ? 'Go to Profile' : 'Get Started Free'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 border-primary-foreground/20 hover:bg-primary-foreground/10"
              data-testid="button-contact-sales"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold">TrustFi</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Building the universal trust layer for the digital economy.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Features</a></li>
                <li><a href="#" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
                <li><a href="#" className="hover:text-foreground">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2024 TrustFi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
