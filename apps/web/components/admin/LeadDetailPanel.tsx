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
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{lead.contactName || 'Unknown Contact'}</h2>
              <p className="text-sm text-slate-500 mt-1">{lead.conversation?.config?.industryName}</p>
            </div>
            {currentStatus === 'TRANSFERRED' ? (
              <span className="text-sm text-slate-500 font-medium px-2 py-1 bg-slate-100 rounded-md dark:bg-slate-800">
                TRANSFERRED
              </span>
            ) : (
              <div className="relative">
                <select
                  value={currentStatus}
                  onChange={(e) => updateStatus(e.target.value)}
                  disabled={updating}
                  className={cn(
                    "text-sm font-medium rounded-md border-slate-200 py-1.5 pl-3 pr-8 dark:bg-slate-900 dark:border-slate-700 dark:text-white transition-opacity",
                    updating && "opacity-50"
                  )}
                >
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {updating && (
                  <RefreshCw size={14} className="absolute right-8 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 mt-6">
            {lead.contactEmail && (
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <Mail size={16} className="text-slate-400" />
                <a href={`mailto:${lead.contactEmail}`} className="hover:text-primary transition-colors">{lead.contactEmail}</a>
              </div>
            )}
            {lead.contactPhone && (
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <Phone size={16} className="text-slate-400" />
                <a href={`tel:${lead.contactPhone}`} className="hover:text-primary transition-colors">{lead.contactPhone}</a>
              </div>
            )}
            {!lead.contactEmail && !lead.contactPhone && (
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <UserIcon size={16} />
                No contact information provided
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 dark:bg-slate-800 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 mb-4 dark:text-white">Qualification Score</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 border-4 border-primary/20 dark:bg-slate-900">
              <span className="text-xl font-bold text-slate-900 dark:text-white">{Math.round(lead.score * 100)}</span>
            </div>
            <div>
              <Badge variant={lead.tier?.toLowerCase() as any || 'neutral'} className="mb-1">
                {lead.tier || 'NONE'}
              </Badge>
              <p className="text-sm text-slate-500 font-medium">{scoreLabel}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 dark:bg-slate-800 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 mb-4 dark:text-white">Extracted Data</h3>
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
                if (deduplicated.length === 0) return <p className="text-sm text-slate-500">No valid data extracted yet.</p>;

                return deduplicated.map((data: any) => {
                  const confidenceColor = data.confidence >= 0.9 ? 'bg-green-500'
                                        : data.confidence >= 0.7 ? 'bg-yellow-500'
                                        : data.confidence >= 0.6 ? 'bg-slate-400'
                                        : 'bg-red-500';
                  
                  const isLowConfidence = data.confidence < 0.6;

                  return (
                    <div key={data.id} className="flex justify-between items-start border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-700">
                      <div className="flex-1 pr-4">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                          {formatFieldKey(data.fieldKey)}
                        </span>
                        <span className="text-sm text-slate-900 font-medium dark:text-white">
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
              <p className="text-sm text-slate-500">No data extracted.</p>
            )}
          </div>
        </div>

      </div>

      {/* Right Column: Transcript */}
      <div className="w-2/3 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <div className="p-4 border-b border-slate-100 bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">Conversation Transcript</h3>
          <p className="text-xs text-slate-500 mt-1">
            Started {new Date(lead.conversation?.startedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {lead.conversation?.messages?.map((msg: any) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {(!lead.conversation?.messages || lead.conversation.messages.length === 0) && (
            <p className="text-center text-slate-500 text-sm mt-8">No messages recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}
