'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { Edit2, Loader2 } from 'lucide-react';

export function ConfigListTable({ token }: { token: string }) {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/industry-configs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch (err) {
      console.error('Failed to fetch configs', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    setToggling(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/industry-configs/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) {
        setConfigs(configs.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading configurations...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
            <TableRow>
              <TableHead>Config ID</TableHead>
              <TableHead>Industry / Persona</TableHead>
              <TableHead>Fields</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No configurations found. Click "New Configuration" to create one.
                </TableCell>
              </TableRow>
            )}
            {configs.map((config) => (
              <TableRow key={config.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                <TableCell className="font-medium text-slate-900 dark:text-white">
                  <div className="flex flex-col">
                    <span>{config.id.slice(0, 8)}...</span>
                    <span className="text-xs text-slate-400">v{config.version}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-white">{config.industryName}</span>
                    <span className="text-sm text-slate-500">{config.personaName} ({config.personaRole})</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 text-xs font-medium px-2 py-1 rounded-md dark:bg-slate-700 dark:text-slate-300">
                    {(config.fieldsJson as any[])?.length || 0} fields
                  </span>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => toggleStatus(config.id, config.isActive)}
                    disabled={toggling === config.id}
                    className="flex items-center gap-2"
                  >
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${config.isActive ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-600'}`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${config.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {config.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {toggling === config.id && <Loader2 size={14} className="animate-spin text-slate-400" />}
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <Link 
                    href={`/dashboard/configs/${config.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 hover:text-slate-900 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-white"
                  >
                    <Edit2 size={14} />
                    Edit
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
