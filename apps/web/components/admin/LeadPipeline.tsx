'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function LeadPipeline({ token }: { token: string }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [tierFilter, setTierFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (tierFilter) params.append('tier', tierFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch leads');
      const data = await res.json();
      setLeads(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, tierFilter, statusFilter]);

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 30000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setLeads((prev) => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
      }
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusOptions = ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lead Pipeline</h1>
        <button
          onClick={fetchLeads}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <RefreshCw size={16} className={cn(loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">Tier:</span>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="text-sm border-slate-200 rounded-md dark:bg-slate-900 dark:border-slate-700 dark:text-white"
          >
            <option value="">All Tiers</option>
            <option value="HOT">Hot</option>
            <option value="WARM">Warm</option>
            <option value="COLD">Cold</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border-slate-200 rounded-md dark:bg-slate-900 dark:border-slate-700 dark:text-white"
          >
            <option value="">All Statuses</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            <option value="TRANSFERRED">TRANSFERRED</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  No leads found.
                </TableCell>
              </TableRow>
            )}
            {leads.map((lead) => (
              <TableRow key={lead.id} className="group">
                <TableCell>
                  <div className="font-medium text-slate-900 dark:text-white">{lead.contactName || 'Unknown'}</div>
                  <div className="text-xs text-slate-500">{lead.contactEmail || lead.contactPhone || 'No contact info'}</div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {lead.conversation?.config?.industryName || 'Unknown'}
                  </span>
                </TableCell>
                <TableCell className="max-w-xs">
                  <p className="text-sm text-slate-600 truncate dark:text-slate-400" title={lead.summary}>
                    {lead.summary}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant={lead.tier?.toLowerCase() as any || 'neutral'}>
                    {lead.tier || 'NONE'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lead.status === 'TRANSFERRED' ? (
                    <span className="text-sm text-slate-500 font-medium px-2 py-1 bg-slate-100 rounded-md dark:bg-slate-800">
                      TRANSFERRED
                    </span>
                  ) : (
                    <div className="relative">
                      <select
                        value={lead.status}
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        disabled={updatingId === lead.id}
                        className={cn(
                          "text-sm font-medium rounded-md border-slate-200 py-1.5 pl-3 pr-8 dark:bg-slate-900 dark:border-slate-700 dark:text-white transition-opacity",
                          updatingId === lead.id && "opacity-50"
                        )}
                      >
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {updatingId === lead.id && (
                        <RefreshCw size={14} className="absolute right-8 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                  {new Date(lead.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <Link 
                    href={`/dashboard/leads/${lead.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 hover:text-slate-900 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                  >
                    View
                    <ArrowRight size={14} />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
