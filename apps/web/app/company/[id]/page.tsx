export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Bot, MessageSquare, ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

interface IndustryConfig {
 id: string;
 industryName: string;
 personaName: string;
 greeting?: string;
}

async function getConfigs(tenantId: string): Promise<{ configs: IndustryConfig[], error: boolean }> {
 const apiUrl = process.env.API_URL || 'http://localhost:3001';
 
 try {
 const res = await fetch(`${apiUrl}/industry-configs/public?tenantId=${tenantId}`, { cache: 'no-store' });
 if (!res.ok) {
 return { configs: [], error: true };
 }
 const data = await res.json();
 return { configs: data, error: false };
 } catch (err) {
 return { configs: [], error: true };
 }
}

export default async function CompanyPage({ params }: { params: { id: string } }) {
 const { configs, error } = await getConfigs(params.id);

 if (error || !configs) {
 return (
 <div className="min-h-screen bg-background p-8 flex items-center justify-center">
 <div className="text-center">
 <p className="text-error mb-4">Failed to load company AI agents.</p>
 <Link href="/">
 <Button variant="outline">Go Back</Button>
 </Link>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-background pb-24">
 {/* Header */}
 <header className="bg-white border-b border-border ">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
 <Link href="/" className="text-secondary hover:text-primary :text-white flex items-center gap-2 transition-colors">
 <ArrowLeft className="w-4 h-4" />
 Back to Companies
 </Link>
 </div>
 </header>

 {/* Hero Section */}
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in-up">
 <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
 Available AI Agents
 </h1>
 <p className="mt-4 text-lg text-secondary ">
 Select an agent below to begin an interactive qualification chat.
 </p>
 </div>

 {/* Configs Grid */}
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 {configs.length === 0 ? (
 <div className="text-center p-12 bg-white rounded-xl border border-border text-secondary">
 This company hasn't deployed any AI agents yet.
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
 {configs.map(config => (
 <Card key={config.id} className="hover:shadow-lg transition-all duration-300">
 <CardHeader>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
 <Bot className="w-5 h-5 text-primary " />
 </div>
 <div>
 <CardTitle className="text-lg">{config.personaName}</CardTitle>
 <p className="text-sm text-secondary mt-0.5">{config.industryName}</p>
 </div>
 </div>
 </CardHeader>
 <CardContent>
 <p className="text-sm text-secondary italic mb-6 line-clamp-3">
 "{config.greeting}"
 </p>
 <Link href={`/chat/${config.id}`} className="w-full">
 <Button className="w-full justify-center">
 <MessageSquare className="w-4 h-4 mr-2" />
 Start Conversation
 </Button>
 </Link>
 </CardContent>
 </Card>
 ))}
 </div>
 )}
 </div>
 </div>
 );
}
