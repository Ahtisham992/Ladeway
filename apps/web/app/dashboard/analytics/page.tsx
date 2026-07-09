import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LeadTierChart, ConversationVolumeChart } from '../../../components/admin/AnalyticsCharts';
import { Card } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';

async function getAnalyticsData(token: string) {
 const to = new Date().toISOString();
 const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
 
 const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

 const [summaryRes, conversationsRes] = await Promise.all([
 fetch(`${baseUrl}/analytics/summary?from=${from}&to=${to}`, {
 headers: { Authorization: `Bearer ${token}` },
 cache: 'no-store'
 }),
 fetch(`${baseUrl}/analytics/conversations?from=${from}&to=${to}`, {
 headers: { Authorization: `Bearer ${token}` },
 cache: 'no-store'
 })
 ]);

 if (!summaryRes.ok || !conversationsRes.ok) {
 throw new Error('Failed to fetch analytics data');
 }

 const summary = await summaryRes.json();
 const timeSeries = await conversationsRes.json();

 return { summary, timeSeries };
}

export default async function AnalyticsPage() {
 const token = cookies().get('access_token')?.value;
 if (!token) redirect('/login');

 const { summary, timeSeries } = await getAnalyticsData(token);

 const hotRate = summary.totalLeads > 0 
 ? Math.round((summary.hotLeads / summary.totalLeads) * 100) 
 : 0;

 return (
 <div className="max-w-7xl mx-auto space-y-8 pb-12">
 <div>
 <h1 className="text-2xl font-bold text-primary ">Analytics</h1>
 <p className="text-secondary mt-1">Overview of conversation performance and lead qualification for the last 30 days.</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 <Card className="p-6 border-border shadow-sm">
 <h3 className="text-sm font-medium text-secondary ">Total Conversations</h3>
 <p className="text-3xl font-bold text-primary mt-2">{summary.totalConversations}</p>
 </Card>
 <Card className="p-6 border-border shadow-sm">
 <h3 className="text-sm font-medium text-secondary ">Qualified Leads</h3>
 <p className="text-3xl font-bold text-primary mt-2">{summary.totalLeads}</p>
 </Card>
 <Card className="p-6 border-border shadow-sm">
 <h3 className="text-sm font-medium text-secondary ">Hot Lead Rate</h3>
 <p className="text-3xl font-bold text-primary mt-2">{hotRate}%</p>
 </Card>
 <Card className="p-6 border-border shadow-sm">
 <h3 className="text-sm font-medium text-secondary ">Avg. Conversation Length</h3>
 <p className="text-3xl font-bold text-primary mt-2">{summary.averageTurnCount} <span className="text-lg font-normal text-secondary">msgs</span></p>
 </Card>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <Card className="p-6 border-border shadow-sm">
 <h2 className="text-lg font-semibold text-primary mb-6">Conversation Volume</h2>
 <ConversationVolumeChart data={timeSeries} />
 </Card>

 <Card className="p-6 border-border shadow-sm flex flex-col justify-between">
 <div>
 <h2 className="text-lg font-semibold text-primary mb-6">Lead Tier Distribution</h2>
 <LeadTierChart hot={summary.hotLeads} warm={summary.warmLeads} cold={summary.coldLeads} />
 </div>
 <div className="mt-8 pt-6 border-t border-border ">
 <h3 className="text-sm font-medium text-secondary mb-4">Lead Funnel</h3>
 <div className="flex h-4 rounded-full overflow-hidden bg-surface-alt ">
 <div 
 style={{ width: `${summary.totalConversations > 0 ? (summary.totalLeads / summary.totalConversations) * 100 : 0}%` }} 
 className="bg-primary transition-all" 
 title={`Qualified: ${summary.totalLeads}`} 
 />
 </div>
 <div className="flex justify-between mt-2 text-xs text-secondary">
 <span>{summary.totalConversations} Conversations</span>
 <span className="font-medium text-primary ">{summary.totalLeads} Qualified</span>
 </div>
 </div>
 </Card>
 </div>

 <Card className="border-border shadow-sm overflow-hidden">
 <div className="p-6 border-b border-border ">
 <h2 className="text-lg font-semibold text-primary ">Industry Breakdown</h2>
 </div>
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Industry / Persona</TableHead>
 <TableHead>Conversations</TableHead>
 <TableHead>Qualified Leads</TableHead>
 <TableHead>Conversion Rate</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {summary.byIndustry.map((ind: any) => (
 <TableRow key={ind.configId}>
 <TableCell className="font-medium text-primary ">{ind.industryName}</TableCell>
 <TableCell>{ind.conversations}</TableCell>
 <TableCell>{ind.leads}</TableCell>
 <TableCell>
 <div className="flex items-center gap-3">
 <span className="w-8 text-right font-medium">{Math.round(ind.conversionRate)}%</span>
 <div className="w-24 h-2 bg-surface-alt rounded-full overflow-hidden">
 <div 
 className="h-full bg-slate-900 " 
 style={{ width: `${ind.conversionRate}%` }}
 />
 </div>
 </div>
 </TableCell>
 </TableRow>
 ))}
 {summary.byIndustry.length === 0 && (
 <TableRow>
 <TableCell colSpan={4} className="text-center py-8 text-secondary">
 No data available for this time period.
 </TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </Card>
 </div>
 );
}
