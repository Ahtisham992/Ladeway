'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../ui/Card';

export function OnboardingWizard({ initialConfig, token }: { initialConfig: any, token: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [personaName, setPersonaName] = useState(initialConfig.personaName);
  const [personaRole, setPersonaRole] = useState(initialConfig.personaRole);
  const [greeting, setGreeting] = useState(initialConfig.greeting);

  const [saving, setSaving] = useState(false);

  const handleSaveAndNext = async () => {
    if (step < 3) {
      if (step === 1) {
        setSaving(true);
        // Only saving step 1 edits (Step 2 fields are read-only in wizard for simplicity)
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          await fetch(`${baseUrl}/industry-configs/${initialConfig.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              personaName,
              personaRole,
              greeting
            })
          });
        } catch (e) {
          console.error(e);
        }
        setSaving(false);
      }
      setStep(step + 1);
    } else {
      router.push('/dashboard/overview');
    }
  };

  const embedCode = `<!-- Add this to your website -->
<script 
  src="https://ladeway.vercel.app/embed.js"
  data-config-id="${initialConfig.id}"
  data-tenant-id="${initialConfig.tenantId}">
</script>`;

  return (
    <Card className="overflow-hidden">
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 p-4 text-center text-sm font-medium border-b-2 ${step === s ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}>
            Step {s}: {s === 1 ? 'Persona' : s === 2 ? 'Fields' : 'Embed'}
          </div>
        ))}
      </div>

      <div className="p-8">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Define your AI Agent</h2>
            <p className="text-slate-500">Give your AI a name, a role, and its first message to your leads.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">AI Name</label>
                <input 
                  type="text" 
                  value={personaName}
                  onChange={e => setPersonaName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">AI Role</label>
                <input 
                  type="text" 
                  value={personaRole}
                  onChange={e => setPersonaRole(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Greeting</label>
                <textarea 
                  value={greeting}
                  onChange={e => setGreeting(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Qualification Fields</h2>
            <p className="text-slate-500">Your agent is pre-configured to ask these questions. You can add more later in the Config Editor.</p>
            
            <div className="space-y-3">
              {initialConfig.fieldsJson.map((field: any, i: number) => (
                <div key={i} className="p-4 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{field.label}</p>
                    <p className="text-xs text-slate-500 font-mono mt-1">{field.key}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-white dark:bg-slate-900 text-xs font-medium border border-slate-200 dark:border-slate-700">
                    {field.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">You're ready to go!</h2>
            <p className="text-slate-500">Copy this code and paste it right before the closing <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">&lt;/body&gt;</code> tag on your website.</p>
            
            <div className="relative">
              <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-slate-300 font-mono">
                {embedCode}
              </pre>
            </div>

            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-primary">
                Your chat widget is live instantly. Any changes you make to your configuration later will automatically reflect on your website.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleSaveAndNext}
            disabled={saving}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {saving ? 'Saving...' : step === 3 ? 'Go to Dashboard' : 'Continue'}
            {!saving && step < 3 && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </Card>
  );
}
