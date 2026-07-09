'use client';

import { useReducer, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { MessageBubble } from '../chat/MessageBubble';
import { Plus, Trash2, Save, PlayCircle, Loader2 } from 'lucide-react';

const QualificationFieldSchema = z.object({
 key: z.string().min(1, 'Key required'),
 label: z.string().min(1, 'Label required'),
 type: z.enum(['text', 'number', 'date', 'enum']),
 required: z.boolean(),
 options: z.array(z.string()).optional(),
 extractionHint: z.string().min(1, 'Hint required'),
});

const ScoringRuleSchema = z.object({
 field: z.string().min(1, 'Field required'),
 condition: z.enum(['present', 'equals', 'greater_than', 'less_than', 'in']),
 value: z.any().optional(),
 weight: z.number().min(0).max(1),
});

const ConfigFormSchema = z.object({
 industryName: z.string().min(2, 'Industry name required'),
 personaName: z.string().min(1, 'Persona name required'),
 personaRole: z.string().min(1, 'Persona role required'),
 greeting: z.string().min(10, 'Greeting must be at least 10 characters'),
 tone: z.enum(['professional', 'friendly', 'formal']),
 fieldsJson: z.array(QualificationFieldSchema).min(1, 'At least one field required'),
 scoringRulesJson: z.array(ScoringRuleSchema),
});

type ConfigState = {
 industryName: string;
 personaName: string;
 personaRole: string;
 greeting: string;
 tone: 'professional' | 'friendly' | 'formal';
 fields: any[];
 rules: any[];
};

type ConfigAction =
 | { type: 'UPDATE_BASIC'; payload: Partial<ConfigState> }
 | { type: 'ADD_FIELD' }
 | { type: 'ADD_FIELD_OBJECT'; payload: any }
 | { type: 'UPDATE_FIELD'; index: number; payload: Partial<any> }
 | { type: 'REMOVE_FIELD'; index: number }
 | { type: 'ADD_RULE' }
 | { type: 'UPDATE_RULE'; index: number; payload: Partial<any> }
 | { type: 'REMOVE_RULE'; index: number };

function configReducer(state: ConfigState, action: ConfigAction): ConfigState {
 switch (action.type) {
 case 'UPDATE_BASIC':
 return { ...state, ...action.payload };
 case 'ADD_FIELD':
 return {
 ...state,
 fields: [...state.fields, { key: '', label: '', type: 'text', required: true, extractionHint: '' }]
 };
 case 'ADD_FIELD_OBJECT':
 return {
 ...state,
 fields: [...state.fields, action.payload],
 rules: [...state.rules, { field: action.payload.key, condition: 'present', value: '', weight: 0.1 }]
 };
 case 'UPDATE_FIELD': {
 const oldKey = state.fields[action.index].key;
 const newKey = action.payload.key ?? oldKey;
 return {
 ...state,
 fields: state.fields.map((f, i) => (i === action.index ? { ...f, ...action.payload } : f)),
 rules: state.rules.map(r => (r.field === oldKey && oldKey !== '' ? { ...r, field: newKey } : r))
 };
 }
 case 'REMOVE_FIELD':
 return {
 ...state,
 fields: state.fields.filter((_, i) => i !== action.index)
 };
 case 'ADD_RULE':
 return {
 ...state,
 rules: [...state.rules, { field: '', condition: 'present', value: '', weight: 0.1 }]
 };
 case 'UPDATE_RULE':
 return {
 ...state,
 rules: state.rules.map((r, i) => (i === action.index ? { ...r, ...action.payload } : r))
 };
 case 'REMOVE_RULE':
 return {
 ...state,
 rules: state.rules.filter((_, i) => i !== action.index)
 };
 default:
 return state;
 }
}

export function ConfigEditor({ token, initialConfig }: { token: string; initialConfig: any | null }) {
 const router = useRouter();
 
 const initialState: ConfigState = {
 industryName: initialConfig?.industryName || '',
 personaName: initialConfig?.personaName || '',
 personaRole: initialConfig?.personaRole || '',
 greeting: initialConfig?.greeting || '',
 tone: initialConfig?.tone || 'professional',
 fields: initialConfig?.fieldsJson || [],
 rules: initialConfig?.scoringRulesJson || [],
 };

 const [state, dispatch] = useReducer(configReducer, initialState);
 const [errors, setErrors] = useState<Record<string, string>>({});
 const [isSaving, setIsSaving] = useState(false);
 const [isPreviewing, setIsPreviewing] = useState(false);
 const [previewMessages, setPreviewMessages] = useState<any[]>([]);
 const [chatInput, setChatInput] = useState('');
 const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
 const [newField, setNewField] = useState({ key: '', label: '', type: 'text', required: false, extractionHint: '' });

 const handleSave = async () => {
 // Validate
 const payload = {
 industryName: state.industryName,
 personaName: state.personaName,
 personaRole: state.personaRole,
 greeting: state.greeting,
 tone: state.tone,
 fieldsJson: state.fields.map(f => ({
    ...f,
    options: f.type === 'enum' && Array.isArray(f.options) 
      ? f.options.map((s: string) => s.trim()).filter(Boolean) 
      : undefined
  })),
 scoringRulesJson: state.rules,
 };

 const result = ConfigFormSchema.safeParse(payload);
 if (!result.success) {
 const newErrors: Record<string, string> = {};
 if (result.error && result.error.issues) {
 result.error.issues.forEach(e => {
 const path = e.path.join('.');
 newErrors[path] = e.message;
 });
 }
 console.log('Validation Errors:', newErrors);
 setErrors(newErrors);
 alert('Validation failed. Please check the red warning text under the fields.');
 return;
 }

 setErrors({});
 setIsSaving(true);

 try {
 const url = initialConfig 
 ? `${process.env.NEXT_PUBLIC_API_URL}/industry-configs/${initialConfig.id}`
 : `${process.env.NEXT_PUBLIC_API_URL}/industry-configs`;
 const method = initialConfig ? 'PUT' : 'POST';

 const res = await fetch(url, {
 method,
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}`
 },
 body: JSON.stringify(payload)
 });

 if (res.ok) {
 const data = await res.json();
 if (data.versioned) {
 router.push(`/dashboard/configs/${data.id}`);
 alert('Configuration updated — new version created');
 } else {
 router.push('/dashboard/configs');
 }
 } else {
 const err = await res.json();
 alert(err.message || 'Failed to save configuration');
 }
 } catch (err) {
 console.error(err);
 alert('Network error while saving');
 } finally {
 setIsSaving(false);
 }
 };

 const sendMessage = async (overrideMessage?: string) => {
 const text = overrideMessage || chatInput;
 if (!text.trim()) return;
 
 const currentMessages = overrideMessage ? [] : previewMessages;
 const newMessages = [...currentMessages, { role: 'user', content: text }];
 setPreviewMessages(newMessages);
 setChatInput('');
 setIsPreviewing(true);

 try {
 const payload = {
 industryName: state.industryName,
 personaName: state.personaName,
 personaRole: state.personaRole,
 greeting: state.greeting,
 tone: state.tone,
 fieldsJson: state.fields,
 messages: newMessages
 };

 const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/industry-configs/preview`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}`
 },
 body: JSON.stringify(payload)
 });

 if (res.ok) {
 const data = await res.json();
 setPreviewMessages([...newMessages, { role: 'assistant', content: data.response }]);
 } else {
 setPreviewMessages([...newMessages, { role: 'assistant', content: 'Failed to generate response.' }]);
 }
 } catch (err) {
 setPreviewMessages([...newMessages, { role: 'assistant', content: 'Network error.' }]);
 } finally {
 setIsPreviewing(false);
 }
 };

 return (
 <div className="space-y-6 pb-24">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-primary ">
 {initialConfig ? `Edit Configuration` : 'New Configuration'}
 </h1>
 <p className="text-secondary mt-1">Configure persona, qualification rules, and scoring logic.</p>
 </div>
 <div className="flex items-center gap-3">
 <Button variant="secondary" onClick={() => sendMessage('Hello')} disabled={isPreviewing}>
 {isPreviewing ? <Loader2 size={16} className="mr-2 animate-spin" /> : <PlayCircle size={16} className="mr-2" />}
 Restart Preview
 </Button>
 <Button onClick={handleSave} disabled={isSaving}>
 {isSaving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
 Save Configuration
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">
 {/* Section 1: Basic Details */}
 <div className="bg-white rounded-xl shadow-sm border border-border p-6 ">
 <h2 className="text-lg font-semibold text-primary mb-4 ">Basic Details</h2>
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <label className="block text-sm font-medium mb-1 text-primary ">Industry Name</label>
 <Input 
 value={state.industryName} 
 onChange={e => dispatch({ type: 'UPDATE_BASIC', payload: { industryName: e.target.value } })}
 placeholder="e.g. Real Estate"
 />
 {errors['industryName'] && <p className="text-error text-xs mt-1">{errors['industryName']}</p>}
 </div>
 <div>
 <label className="block text-sm font-medium mb-1 text-primary ">Persona Name</label>
 <Input 
 value={state.personaName} 
 onChange={e => dispatch({ type: 'UPDATE_BASIC', payload: { personaName: e.target.value } })}
 placeholder="e.g. Sarah"
 />
 {errors['personaName'] && <p className="text-error text-xs mt-1">{errors['personaName']}</p>}
 </div>
 <div>
 <label className="block text-sm font-medium mb-1 text-primary ">Persona Role</label>
 <Input 
 value={state.personaRole} 
 onChange={e => dispatch({ type: 'UPDATE_BASIC', payload: { personaRole: e.target.value } })}
 placeholder="e.g. Senior Property Advisor"
 />
 {errors['personaRole'] && <p className="text-error text-xs mt-1">{errors['personaRole']}</p>}
 </div>
 <div className="col-span-2">
 <label className="block text-sm font-medium mb-1 text-primary ">Greeting Message</label>
 <textarea 
 className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-primary "
 rows={2}
 value={state.greeting}
 onChange={e => dispatch({ type: 'UPDATE_BASIC', payload: { greeting: e.target.value } })}
 placeholder="e.g. Hello! I'm Sarah, a senior property advisor..."
 />
 {errors['greeting'] && <p className="text-error text-xs mt-1">{errors['greeting']}</p>}
 </div>
 <div className="col-span-2">
 <label className="block text-sm font-medium mb-1 text-primary ">Tone</label>
 <Select 
 value={state.tone} 
 onChange={e => dispatch({ type: 'UPDATE_BASIC', payload: { tone: e.target.value as any } })}
 >
 <option value="professional">Professional</option>
 <option value="friendly">Friendly</option>
 <option value="formal">Formal</option>
 </Select>
 {errors['tone'] && <p className="text-error text-xs mt-1">{errors['tone']}</p>}
 </div>
 </div>
 </div>

 {/* Section 2: Fields */}
 <div className="bg-white rounded-xl shadow-sm border border-border p-6 ">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold text-primary ">Qualification Fields</h2>
 <Button size="sm" variant="secondary" onClick={() => setIsFieldModalOpen(true)}>
 <Plus size={14} className="mr-1" /> Add Field
 </Button>
 </div>
 {errors['fieldsJson'] && <p className="text-error text-xs mb-4">{errors['fieldsJson']}</p>}
 
 <div className="space-y-4">
 {state.fields.map((field, i) => (
 <div key={i} className="p-4 border border-border rounded-lg bg-background relative">
 <button 
 onClick={() => dispatch({ type: 'REMOVE_FIELD', index: i })}
 className="absolute top-4 right-4 text-secondary-light hover:text-error transition-colors"
 >
 <Trash2 size={16} />
 </button>
 <div className="grid grid-cols-2 gap-4 pr-8">
 <div>
 <label className="block text-xs font-medium mb-1 text-secondary">System ID (Internal)</label>
 <Input 
 value={field.key} 
 onChange={e => dispatch({ type: 'UPDATE_FIELD', index: i, payload: { key: e.target.value } })}
 placeholder="e.g. property_type"
 />
 {errors[`fieldsJson.${i}.key`] && <p className="text-error text-xs mt-1">{errors[`fieldsJson.${i}.key`]}</p>}
 </div>
 <div>
 <label className="block text-xs font-medium mb-1 text-secondary">Label (Display Name)</label>
 <Input 
 value={field.label} 
 onChange={e => dispatch({ type: 'UPDATE_FIELD', index: i, payload: { label: e.target.value } })}
 placeholder="e.g. Property Type"
 />
 {errors[`fieldsJson.${i}.label`] && <p className="text-error text-xs mt-1">{errors[`fieldsJson.${i}.label`]}</p>}
 </div>
 <div>
 <label className="block text-xs font-medium mb-1 text-secondary">Type</label>
 <Select 
 value={field.type} 
 onChange={e => dispatch({ type: 'UPDATE_FIELD', index: i, payload: { type: e.target.value } })}
 >
 <option value="text">Text (e.g., words, sentences)</option>
 <option value="number">Number (e.g., age, price)</option>
 <option value="date">Date (e.g., timeline, deadlines)</option>
 <option value="enum">Multiple Choice (Options)</option>
 </Select>
 </div>
 <div className="flex items-center pt-6">
 <label className="flex items-center gap-2 text-sm font-medium">
 <input 
 type="checkbox" 
 checked={field.required}
 onChange={e => dispatch({ type: 'UPDATE_FIELD', index: i, payload: { required: e.target.checked } })}
 className="rounded border-border text-primary focus:ring-primary"
 />
 Required for Qualification
 </label>
 </div>
 <div className="col-span-2">
 <label className="block text-xs font-medium mb-1 text-secondary">Instructions for AI (Extraction Hint)</label>
 <Input 
 value={field.extractionHint} 
 onChange={e => dispatch({ type: 'UPDATE_FIELD', index: i, payload: { extractionHint: e.target.value } })}
 placeholder="e.g. The type of property they want to buy"
 />
 {errors[`fieldsJson.${i}.extractionHint`] && <p className="text-error text-xs mt-1">{errors[`fieldsJson.${i}.extractionHint`]}</p>}
 </div>
 {field.type === 'enum' && (
 <div className="col-span-2">
 <label className="block text-xs font-medium mb-1 text-secondary">Options (Comma separated)</label>
 <Input 
 value={Array.isArray(field.options) ? field.options.join(',') : (field.options || '')} 
 onChange={e => dispatch({ type: 'UPDATE_FIELD', index: i, payload: { options: e.target.value.split(',') } })}
 placeholder="e.g. Option 1, Option 2"
 />
 </div>
 )}
 </div>
 </div>
 ))}
 {state.fields.length === 0 && (
 <p className="text-secondary text-sm text-center py-4">No fields added yet. Add a field to start collecting data.</p>
 )}
 </div>
 </div>

 {/* Section 3: Scoring Rules */}
 <div className="bg-white rounded-xl shadow-sm border border-border p-6 ">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold text-primary ">Scoring Rules</h2>
 <Button size="sm" variant="outline" onClick={() => dispatch({ type: 'ADD_RULE' })}>
 <Plus size={14} className="mr-1" /> Add Rule
 </Button>
 </div>
 
 <div className="space-y-4">
 {state.rules.map((rule, i) => (
 <div key={i} className="p-4 border border-border rounded-lg bg-background relative">
 <button 
 onClick={() => dispatch({ type: 'REMOVE_RULE', index: i })}
 className="absolute top-4 right-4 text-secondary-light hover:text-error transition-colors"
 >
 <Trash2 size={16} />
 </button>
 <div className="grid grid-cols-4 gap-4 pr-8">
 <div>
 <label className="block text-xs font-medium mb-1 text-secondary">Field</label>
 <Select 
 value={rule.field} 
 onChange={e => dispatch({ type: 'UPDATE_RULE', index: i, payload: { field: e.target.value } })}
 >
 <option value="" disabled>Select field</option>
 {state.fields.map(f => (
 <option key={f.key} value={f.key}>{f.key}</option>
 ))}
 </Select>
 {errors[`scoringRulesJson.${i}.field`] && <p className="text-error text-xs mt-1">{errors[`scoringRulesJson.${i}.field`]}</p>}
 </div>
 <div>
 <label className="block text-xs font-medium mb-1 text-secondary">Condition</label>
 <Select 
 value={rule.condition} 
 onChange={e => dispatch({ type: 'UPDATE_RULE', index: i, payload: { condition: e.target.value } })}
 >
 <option value="equals">Exactly matches</option>
 <option value="in">Contains any of</option>
 <option value="greater_than">Is more than</option>
 <option value="less_than">Is less than</option>
 <option value="present">Has any value</option>
 </Select>
 </div>
 <div>
 <label className="block text-xs font-medium mb-1 text-secondary">Target Value</label>
 <Input 
 value={rule.value || ''} 
 onChange={e => dispatch({ type: 'UPDATE_RULE', index: i, payload: { value: e.target.value } })}
 placeholder="Value..."
 />
 </div>
 <div>
 <label className="block text-xs font-medium mb-1 text-secondary">Weight (0.0 - 1.0)</label>
 <Input 
 type="number"
 step="0.1"
 min="0"
 max="1"
 value={rule.weight} 
 onChange={e => dispatch({ type: 'UPDATE_RULE', index: i, payload: { weight: parseFloat(e.target.value) } })}
 />
 {errors[`scoringRulesJson.${i}.weight`] && <p className="text-error text-xs mt-1">{errors[`scoringRulesJson.${i}.weight`]}</p>}
 </div>
 </div>
 </div>
 ))}
 {state.rules.length === 0 && (
 <p className="text-secondary text-sm text-center py-4">No scoring rules added. Leads will start at 0 score.</p>
 )}
 </div>
 </div>
 </div>

 {/* Section 4: Live Preview Sidebar */}
 <div className="lg:col-span-1">
 <div className="sticky top-6 bg-white rounded-xl shadow-sm border border-border overflow-hidden flex flex-col h-[600px] ">
 <div className="p-4 border-b border-border bg-background flex justify-between items-center">
 <div>
 <h3 className="font-semibold text-primary flex items-center gap-2 ">
 <PlayCircle size={18} className="text-primary" />
 Live Preview
 </h3>
 <p className="text-xs text-secondary mt-1">Test your configuration.</p>
 </div>
 <Button size="sm" variant="secondary" onClick={() => sendMessage('Hello')} disabled={isPreviewing}>Restart</Button>
 </div>
 <div className="flex-1 overflow-y-auto p-4 bg-background/50 space-y-4">
 {previewMessages.length === 0 && !isPreviewing ? (
 <div className="h-full flex flex-col items-center justify-center text-secondary-light">
 <p className="text-sm text-center px-6">Click "Restart" to test how the AI will greet users.</p>
 </div>
 ) : (
 previewMessages.map((msg, idx) => (
 <MessageBubble key={idx} message={{ id: `preview-${idx}`, sender: msg.role === 'user' ? 'user' : 'ai', content: msg.content }} />
 ))
 )}
 {isPreviewing && (
 <div className="flex justify-center my-4">
 <Loader2 size={24} className="animate-spin text-primary/50" />
 </div>
 )}
 </div>
 <div className="p-3 border-t border-border bg-white ">
 <div className="flex gap-2">
 <Input 
 value={chatInput} 
 onChange={e => setChatInput(e.target.value)} 
 onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
 placeholder="Type a message..." 
 disabled={isPreviewing}
 />
 <Button onClick={() => sendMessage()} disabled={isPreviewing || !chatInput.trim()}>Send</Button>
 </div>
 </div>
 </div>
 </div>
 </div>

 <Modal isOpen={isFieldModalOpen} onClose={() => setIsFieldModalOpen(false)} title="Add Qualification Field">
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium mb-1">Label</label>
 <Input 
 value={newField.label} 
 onChange={e => {
 const label = e.target.value;
 const generatedOldKey = newField.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
 const update: any = { label };
 if (!newField.key || newField.key === generatedOldKey) {
 update.key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
 }
 setNewField({ ...newField, ...update });
 }}
 placeholder="e.g. Property Type" 
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">JSON Key</label>
 <Input value={newField.key} onChange={e => setNewField({ ...newField, key: e.target.value })} placeholder="e.g. property_type" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium mb-1">Field Type</label>
 <Select value={newField.type} onChange={e => setNewField({ ...newField, type: e.target.value })}>
 <option value="text">Text (e.g., words, sentences)</option>
 <option value="number">Number (e.g., age, price)</option>
 <option value="date">Date (e.g., timeline, deadlines)</option>
 <option value="enum">Multiple Choice (Options)</option>
 </Select>
 </div>
 <div className="flex items-center gap-2 mt-6">
 <input type="checkbox" id="req" checked={newField.required} onChange={e => setNewField({ ...newField, required: e.target.checked })} />
 <label htmlFor="req" className="text-sm font-medium">Required for Qualification</label>
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">Instructions for AI (Extraction Hint)</label>
 <Input value={newField.extractionHint} onChange={e => setNewField({ ...newField, extractionHint: e.target.value })} placeholder="e.g. Look for..." />
 </div>
 {newField.type === 'enum' && (
 <div>
 <label className="block text-sm font-medium mb-1">Options (Comma separated)</label>
 <Input 
 value={Array.isArray((newField as any).options) ? (newField as any).options.join(',') : ((newField as any).options || '')} 
 onChange={e => setNewField({ ...newField, options: e.target.value.split(',') } as any)} 
 placeholder="e.g. Option 1, Option 2" 
 />
 </div>
 )}
 <div className="flex justify-end gap-2 mt-6">
 <Button variant="ghost" onClick={() => setIsFieldModalOpen(false)}>Cancel</Button>
 <Button onClick={() => {
 if(!newField.key || !newField.label) { alert('Key and Label are required'); return; }
 dispatch({ type: 'ADD_FIELD_OBJECT', payload: newField });
 setIsFieldModalOpen(false);
 setNewField({ key: '', label: '', type: 'text', required: false, extractionHint: '' });
 }}>Save Field</Button>
 </div>
 </div>
 </Modal>
 </div>
 );
}
