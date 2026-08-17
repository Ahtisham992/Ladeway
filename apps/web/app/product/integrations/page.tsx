import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <h1 className="text-4xl font-bold text-primary mb-6">Integrations</h1>
        <div className="prose prose-lg text-secondary max-w-none">
          <p>Ladeway connects seamlessly with the tools your team already uses every day.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="p-6 bg-white border border-border rounded-xl shadow-sm">
              <h3 className="font-bold text-primary mb-2">Salesforce (Coming Soon)</h3>
              <p className="text-sm">Automatically sync qualified leads directly into your Salesforce CRM.</p>
            </div>
            <div className="p-6 bg-white border border-border rounded-xl shadow-sm">
              <h3 className="font-bold text-primary mb-2">HubSpot (Coming Soon)</h3>
              <p className="text-sm">Push scored leads to HubSpot to trigger automated email sequences.</p>
            </div>
            <div className="p-6 bg-white border border-border rounded-xl shadow-sm">
              <h3 className="font-bold text-primary mb-2">Slack (Coming Soon)</h3>
              <p className="text-sm">Get real-time pings in your Slack channels when a HOT lead is captured.</p>
            </div>
            <div className="p-6 bg-white border border-border rounded-xl shadow-sm">
              <h3 className="font-bold text-primary mb-2">Webhooks</h3>
              <p className="text-sm">Build custom integrations with our flexible outbound webhooks architecture.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
