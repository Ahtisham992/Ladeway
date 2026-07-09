'use client';

import { useState } from 'react';
import { MessageBubble } from '../chat/MessageBubble';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { RefreshCw, Phone, Mail, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

function formatFieldKey(key: string): string {
 return key
 .split('_')
 .map(word => word.charAt(0).toUpperCase() + word.slice(1))
 .join(' ');
}

export function LeadDetailPanel({ lead, token }: { lead: any, token: string }) {
 const [updating, setUpdating] = useState(false);
 const [currentStatus, setCurrentStatus] = useState(lead.status);

 const statusOptions = ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'];

 const updateStatus = async (newStatus: string) => {
 setUpdating(true);
 try {
 const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${lead.id}`, {
 method: 'PATCH',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}`
 },
 body: JSON.stringify({ status: newStatus })
 });
 if (res.ok) {
 setCurrentStatus(newStatus);
 }
 } catch (err) {
 console.error('Failed to update status', err);
 } finally {
 setUpdating(false);
 }
 };

 const scoreLabel = lead.score >= 0.7 ? 'Strong match'
 : lead.score >= 0.4 ? 'Moderate match' 
 : 'Weak match';

 return (
 <div className="flex gap-6 h-[calc(100vh-6rem)]">
 {/* Left Column: Metrics & Data */}
 <div className="w-1/3 flex flex-col gap-6 overflow-y-auto">
 
 <div className="bg-white rounded-xl shadow-sm border border-border p-6 ">
 <div className="flex items-start justify-between mb-4">
 <div>
 <h2 className="text-xl font-bold text-primary ">{lead.contactName || 'Unknown Contact'}</h2>
 <p className="text-sm text-secondary mt-1">{lead.conversation?.config?.industryName}</p>
 </div>
 {currentStatus === 'TRANSFERRED' ? (
 <span className="text-sm text-secondary font-medium px-2 py-1 bg-surface-alt rounded-md ">
 TRANSFERRED
 </span>
 ) : (
 <div className="relative">
 <select
 value={currentStatus}
 onChange={(e) => updateStatus(e.target.value)}
 disabled={updating}
 className={cn(
 "text-sm font-medium rounded-md border-border py-1.5 pl-3 pr-8 transition-opacity",
 updating && "opacity-50"
 )}
 >
 {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
 </select>
 {updating && (
 <RefreshCw size={14} className="absolute right-8 top-1/2 -translate-y-1/2 animate-spin text-secondary-light" />
 )}
 </div>
 )}
 </div>

 <div className="space-y-3 mt-6">
 {lead.contactEmail && (
 <div className="flex items-center gap-3 text-sm text-secondary ">
 <Mail size={16} className="text-secondary-light" />
 <a href={`mailto:${lead.contactEmail}`} className="hover:text-primary transition-colors">{lead.contactEmail}</a>
 </div>
 )}
 {lead.contactPhone && (
 <div className="flex items-center gap-3 text-sm text-secondary ">
 <Phone size={16} className="text-secondary-light" />
 <a href={`tel:${lead.contactPhone}`} className="hover:text-primary transition-colors">{lead.contactPhone}</a>
 </div>
 )}
 {!lead.contactEmail && !lead.contactPhone && (
 <div className="flex items-center gap-3 text-sm text-secondary-light">
 <UserIcon size={16} />
 No contact information provided
 </div>
 )}
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-border p-6 ">
 <h3 className="text-sm font-semibold text-primary mb-4 ">Qualification Score</h3>
 <div className="flex items-center gap-4">
 <div className="flex items-center justify-center w-16 h-16 rounded-full bg-background border-4 border-primary/20 ">
 <span className="text-xl font-bold text-primary ">{Math.round(lead.score * 100)}</span>
 </div>
 <div>
 <Badge tier={lead.tier as any || 'DEFAULT'} className="mb-1">
 {lead.tier || 'NONE'}
 </Badge>
 <p className="text-sm text-secondary font-medium">{scoreLabel}</p>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-border p-6 ">
 <h3 className="text-sm font-semibold text-primary mb-4 ">Extracted Data</h3>
 <div className="space-y-4">
 {lead.conversation?.extractedData?.length > 0 ? (
 (() => {
 const map = new Map();
 for (const d of lead.conversation.extractedData) {
 const val = d.fieldValue?.toLowerCase() || '';
 if (val && val !== 'null' && val !== 'none' && val !== 'not explicitly stated' && val !== 'not specified') {
 map.set(d.fieldKey, d);
 }
 }
 const deduplicated = Array.from(map.values());
 if (deduplicated.length === 0) return <p className="text-sm text-secondary">No valid data extracted yet.</p>;

 return deduplicated.map((data: any) => {
 const confidenceColor = data.confidence >= 0.9 ? 'bg-success/100'
 : data.confidence >= 0.7 ? 'bg-warning/100'
 : data.confidence >= 0.6 ? 'bg-slate-400'
 : 'bg-error/100';
 
 const isLowConfidence = data.confidence < 0.6;

 return (
 <div key={data.id} className="flex justify-between items-start border-b border-border pb-3 last:border-0 last:pb-0 ">
 <div className="flex-1 pr-4">
 <span className="text-xs font-medium text-secondary-light uppercase tracking-wider block mb-1">
 {formatFieldKey(data.fieldKey)}
 </span>
 <span className="text-sm text-primary font-medium ">
 {data.fieldValue || '—'}
 </span>
 </div>
 <div className="flex items-center pt-2" title={isLowConfidence ? "Low confidence — verify with customer." : `Confidence: ${Math.round(data.confidence * 100)}%`}>
 <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", confidenceColor)} />
 </div>
 </div>
 );
 });
 })()
 ) : (
 <p className="text-sm text-secondary">No data extracted.</p>
 )}
 </div>
 </div>

 </div>

 {/* Right Column: Transcript */}
 <div className="w-2/3 bg-white rounded-xl shadow-sm border border-border flex flex-col overflow-hidden ">
 <div className="p-4 border-b border-border bg-background ">
 <h3 className="font-semibold text-primary ">Conversation Transcript</h3>
 <p className="text-xs text-secondary mt-1">
 Started {new Date(lead.conversation?.startedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
 </p>
 </div>
 <div className="flex-1 overflow-y-auto p-6 space-y-4">
 {lead.conversation?.messages?.map((msg: any) => (
 <MessageBubble key={msg.id} message={msg} />
 ))}
 {(!lead.conversation?.messages || lead.conversation.messages.length === 0) && (
 <p className="text-center text-secondary text-sm mt-8">No messages recorded.</p>
 )}
 </div>
 </div>
 </div>
 );
}
