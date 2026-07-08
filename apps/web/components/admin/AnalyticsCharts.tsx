import React from 'react';

export function LeadTierChart({ hot, warm, cold }: { hot: number, warm: number, cold: number }) {
  const total = hot + warm + cold;
  const hotPct = total > 0 ? (hot / total) * 100 : 0;
  const warmPct = total > 0 ? (warm / total) * 100 : 0;
  const coldPct = total > 0 ? (cold / total) * 100 : 0;

  return (
    <div>
      <div className="flex h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
        <div style={{ width: `${hotPct}%` }} className="bg-slate-900 dark:bg-slate-200 transition-all" title={`HOT: ${hot}`} />
        <div style={{ width: `${warmPct}%` }} className="bg-slate-600 dark:bg-slate-500 transition-all" title={`WARM: ${warm}`} />
        <div style={{ width: `${coldPct}%` }} className="bg-slate-400 dark:bg-slate-700 transition-all" title={`COLD: ${cold}`} />
      </div>
      <div className="flex gap-4 mt-4 text-sm font-medium">
        <span className="flex items-center gap-1.5 text-slate-900 dark:text-slate-200"><span className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-slate-200"></span> HOT: {hot}</span>
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-slate-600 dark:bg-slate-500"></span> WARM: {warm}</span>
        <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-700"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-700"></span> COLD: {cold}</span>
      </div>
    </div>
  );
}

export function ConversationVolumeChart({ data }: { data: { date: string, count: number }[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const shouldShowLabel = (index: number, total: number) => {
    const step = Math.max(Math.floor(total / 5), 1);
    return index % step === 0 || index === total - 1;
  };

  return (
    <div className="pt-4 pb-6">
      <div className="flex items-end gap-1 h-40">
        {data.map((day, i) => (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
            <div 
              className="w-full bg-slate-400 dark:bg-slate-600 hover:bg-slate-900 dark:hover:bg-slate-300 transition-colors rounded-t"
              style={{ height: `${(day.count / maxCount) * 100}%`, minHeight: day.count > 0 ? '4px' : '0px' }}
              title={`${formatDate(day.date)}: ${day.count} conversations`}
            />
            <div className="h-4 absolute -bottom-6 flex justify-center w-full">
              {shouldShowLabel(i, data.length) && (
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {formatDate(day.date)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
