export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Bot, MessageSquare, Building2, Zap, Target, Layers, CheckCircle, PhoneCall, Mic } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

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
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 animate-fade-in-up">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content Column */}
            <div>
              <div className="inline-flex items-center text-xs font-bold text-secondary uppercase tracking-widest mb-6 border-b border-border pb-1">
                Accelerated AI Pipelines from Raw Traffic to Qualified Leads
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-primary tracking-tight leading-tight mb-6">
                At Ladeway, we design and build end-to-end qualification systems.
              </h1>
              <p className="text-xl font-medium text-secondary-900 italic mb-6 border-l-4 border-primary pl-4">
                Our vision: "Converting complex conversations into actionable data."
              </p>
              <p className="text-lg text-secondary mb-10 max-w-lg">
                Ladeway provides intelligent, industry-agnostic AI agents. We develop software for natural language processing, dynamic scoring, and ultra-low latency voice pipelines.
              </p>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-12">
                <Link href="/signup">
                  <Button size="lg" className="bg-primary text-white hover:bg-primary-dark px-8 shadow-md hover:shadow-lg transition-all rounded-full h-14 text-lg">
                    Explore our platform
                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </Button>
                </Link>
                <a href="#catalog" className="group flex items-center text-lg font-semibold text-primary hover:text-primary-dark transition-colors">
                  <span className="border-b-2 border-primary group-hover:border-primary-dark pb-0.5">Talk to our AI</span>
                  <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </a>
              </div>

              {/* Tag Pills */}
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-1.5 rounded-full border border-border text-xs font-semibold text-secondary uppercase tracking-wider bg-white">VOICE AI</span>
                <span className="px-4 py-1.5 rounded-full border border-border text-xs font-semibold text-secondary uppercase tracking-wider bg-white">TEXT CHATBOTS</span>
                <span className="px-4 py-1.5 rounded-full border border-border text-xs font-semibold text-secondary uppercase tracking-wider bg-white">DYNAMIC SCORING</span>
              </div>
            </div>

            {/* Right Visual Column */}
            <div className="relative hidden lg:block aspect-square w-full max-w-[550px] mx-auto">
              {/* Background circular highlight */}
              <div className="absolute inset-0 bg-gradient-to-tr from-surface to-white rounded-full opacity-70 border border-border"></div>
              
              {/* Grid pattern overlay */}
              <div className="absolute inset-0 rounded-full" style={{ backgroundImage: 'linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)', backgroundSize: '30px 30px', opacity: 0.5, clipPath: 'circle(50% at 50% 50%)' }}></div>

              {/* Central Processing Node */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-40 bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-700 p-4 z-20 flex flex-col items-center justify-center animate-float">
                <div className="text-[10px] text-gray-400 font-mono absolute top-3 left-4 uppercase tracking-widest">Ladeway Core</div>
                <div className="w-16 h-16 border border-gray-600 rounded-lg flex items-center justify-center relative mt-2">
                  <div className="absolute inset-1 bg-gradient-to-br from-primary to-primary-dark rounded-md opacity-20 animate-pulse-slow"></div>
                  <Bot className="w-8 h-8 text-primary-light" />
                  <div className="absolute -right-1 -top-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                </div>
                <div className="flex gap-1 mt-4">
                  {[...Array(6)].map((_, i) => <div key={i} className="w-1 h-3 bg-gray-600 rounded-full opacity-50"></div>)}
                </div>
              </div>

              {/* Input Node 1 (Voice) */}
              <div className="absolute top-[15%] left-[5%] w-32 bg-white rounded-lg shadow-lg border border-border p-3 z-30 animate-float-delayed flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Mic className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xs font-semibold text-secondary">Audio Stream</div>
              </div>

              {/* Input Node 2 (Chat) */}
              <div className="absolute bottom-[20%] left-[-2%] w-36 bg-white rounded-lg shadow-lg border border-border p-3 z-30 animate-float flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-xs font-semibold text-secondary">Text Payload</div>
              </div>

              {/* Output Node (Qualified Lead) */}
              <div className="absolute bottom-[15%] right-[2%] w-44 bg-white rounded-xl shadow-xl border border-border p-4 z-30 animate-float-delayed">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Output</span>
                  <span className="px-2 py-0.5 bg-success/10 text-success text-[10px] font-bold rounded-full border border-success/20">HOT LEAD</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-surface rounded w-3/4"></div>
                  <div className="h-2 bg-surface rounded w-1/2"></div>
                  <div className="h-2 bg-surface rounded w-5/6"></div>
                </div>
              </div>

              {/* Connecting Lines SVG */}
              <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none" viewBox="0 0 550 550" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.05))' }}>
                {/* Voice to Core */}
                <path d="M 120 120 Q 250 120 275 220" fill="none" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="6,6" className="animate-dash-scroll" />
                {/* Chat to Core */}
                <path d="M 100 440 Q 200 440 275 330" fill="none" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="6,6" className="animate-dash-scroll" />
                {/* Core to Output */}
                <path d="M 380 330 Q 480 330 480 410" fill="none" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="6,6" className="animate-dash-scroll" />
                
                {/* Animated Data Packets (Circles) along paths */}
                <circle r="5" fill="#1F4E79">
                  <animateMotion dur="3s" repeatCount="indefinite" path="M 120 120 Q 250 120 275 220" />
                </circle>
                <circle r="5" fill="#1F4E79">
                  <animateMotion dur="4s" repeatCount="indefinite" path="M 100 440 Q 200 440 275 330" />
                </circle>
                <circle r="5" fill="#15803D">
                  <animateMotion dur="2.5s" repeatCount="indefinite" path="M 380 330 Q 480 330 480 410" />
                </circle>
              </svg>
            </div>
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
                    <div className="flex gap-3 mt-auto w-full pt-4 border-t border-border/50">
                      <Link href={`/chat/${config.id}`} className="flex-1">
                        <Button variant="default" className="w-full justify-center bg-primary text-white hover:bg-primary-dark shadow-sm transition-all duration-200">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Text Chat
                        </Button>
                      </Link>
                      <Link href={`/voice/${config.id}`} className="flex-1">
                        <Button variant="outline" className="w-full justify-center border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary shadow-sm transition-all duration-200">
                          <PhoneCall className="w-4 h-4 mr-2" />
                          Voice Call
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
      <Footer />
    </div>
  );
}
