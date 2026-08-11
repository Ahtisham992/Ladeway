export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Bot, MessageSquare, Building2, Zap, Target, Layers, CheckCircle, PhoneCall } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

interface TenantInfo {
  name: string;
  subdomain: string;
}

interface IndustryConfig {
  id: string;
  industryName: string;
  personaName: string;
  greeting?: string;
  tenant?: TenantInfo;
}

async function getConfigs(): Promise<{ configs: IndustryConfig[], error: boolean }> {
  const apiUrl = process.env.API_URL || 'http://localhost:3001';
  
  try {
    const res = await fetch(`${apiUrl}/industry-configs/public`, { cache: 'no-store' });
    if (!res.ok) {
      return { configs: [], error: true };
    }
    const data = await res.json();
    return { configs: data, error: false };
  } catch (err) {
    return { configs: [], error: true };
  }
}

export default async function LandingPage() {
  const { configs, error } = await getConfigs();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-secondary hover:text-primary transition-colors">
              Log in
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-primary text-white hover:bg-primary-dark">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center animate-fade-in-up">
          <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-primary bg-primary/10 mb-8">
            <Zap className="w-4 h-4 mr-2" />
            The Future of Customer Acquisition
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-primary tracking-tight max-w-4xl mx-auto leading-tight">
            AI-Powered Lead Qualification <br/> on Autopilot
          </h1>
          <p className="mt-6 text-lg text-secondary max-w-2xl mx-auto">
            Stop losing leads to slow response times. Ladeway's AI agents engage, qualify, and score your inbound traffic 24/7, handing you only the hottest opportunities.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-primary text-white hover:bg-primary-dark px-8">Start Free Trial</Button>
            </Link>
            <a href="#catalog">
              <Button size="lg" variant="outline" className="px-8 border-border hover:bg-surface">View Live Demos</Button>
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white border-y border-border py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-primary tracking-tight">Everything you need to close more deals</h2>
              <p className="mt-4 text-secondary max-w-2xl mx-auto">Our platform provides end-to-end qualification customized perfectly for your industry.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">Conversational AI</h3>
                <p className="text-secondary">Engage visitors instantly with natural, human-like conversations tailored to your brand's unique tone and persona.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">Dynamic Scoring</h3>
                <p className="text-secondary">Automatically extract data points from the chat and score leads as HOT, WARM, or COLD based on your custom rules.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Layers className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">Instant Handoff</h3>
                <p className="text-secondary">The moment a lead qualifies as HOT, they are instantly routed to your sales team with a complete summary of the chat.</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="py-24 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-primary tracking-tight">How it works</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
                <div className="text-5xl font-extrabold text-primary/10 mb-4">01</div>
                <h4 className="text-lg font-bold text-primary mb-2">Configure Industry</h4>
                <p className="text-secondary text-sm">Define exactly what information you need to extract from leads (e.g., Timeline, Budget, Company Size).</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
                <div className="text-5xl font-extrabold text-primary/10 mb-4">02</div>
                <h4 className="text-lg font-bold text-primary mb-2">Set Scoring Rules</h4>
                <p className="text-secondary text-sm">Create logic to determine lead quality. If "Budget" is greater than "$10k", mark them as HOT.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
                <div className="text-5xl font-extrabold text-primary/10 mb-4">03</div>
                <h4 className="text-lg font-bold text-primary mb-2">Deploy Anywhere</h4>
                <p className="text-secondary text-sm">Paste our lightweight JavaScript snippet onto your website and watch the qualified leads roll in.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Agents Catalog Grid */}
        <div id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary tracking-tight">Live Demonstrations</h2>
            <p className="mt-4 text-secondary max-w-2xl mx-auto">Explore AI Agents created by our partners. Chat with them to see the qualification engine in action.</p>
          </div>

          {error ? (
            <div className="text-center p-8 bg-error/10 text-error rounded-lg border border-error/20">
              Failed to load AI Agents. Is the API server running?
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-lg border border-border text-secondary">
              No AI Agents are currently available in the catalog. Be the first to build one!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {configs.map(config => (
                <Card key={config.id} className="bg-white border border-border shadow-sm rounded-lg hover:shadow-md hover:border-primary/20 transition-all group flex flex-col h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-secondary-light" />
                        <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                          {config.tenant?.name || 'Unknown Company'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg leading-tight text-gray-900">{config.personaName}</CardTitle>
                        <p className="text-sm text-secondary mt-0.5">{config.industryName}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <p className="text-sm text-secondary italic mb-6 line-clamp-3 relative pl-4 border-l-2 border-primary/20">
                      "{config.greeting}"
                    </p>
                    <div className="flex flex-col gap-2 mt-auto w-full">
                      <Link href={`/chat/${config.id}`} className="w-full">
                        <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors border-border">
                          Start Conversation
                          <MessageSquare className="w-4 h-4 ml-2 opacity-70" />
                        </Button>
                      </Link>
                      <Link href={`/voice/${config.id}`} className="w-full">
                        <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors border-border bg-primary/5">
                          Call Voice Assistant
                          <PhoneCall className="w-4 h-4 ml-2 opacity-70" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center mb-4 opacity-70">
                <Logo />
              </div>
              <p className="text-sm text-secondary">
                Intelligent conversational qualification for modern sales teams.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-secondary">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-secondary">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-secondary">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-secondary">
            <p>&copy; {new Date().getFullYear()} Ladeway Inc. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-primary transition-colors">Twitter</a>
              <a href="#" className="hover:text-primary transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-primary transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
