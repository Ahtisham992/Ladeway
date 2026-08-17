import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <h1 className="text-4xl font-bold text-primary mb-2">Privacy Policy</h1>
        <p className="text-secondary mb-12">Last Updated: August 2026</p>
        
        <div className="prose prose-lg text-secondary max-w-none">
          <p>At Ladeway, we take your privacy seriously. This Privacy Policy describes how we collect, use, and protect your personal data when you use our conversational AI platform.</p>
          
          <h2 className="text-2xl font-bold text-primary mt-8 mb-4">1. Information We Collect</h2>
          <p>When you deploy a Ladeway AI agent, we collect interaction data (text and audio transcripts) between the agent and your end-users. This data is strictly used to fulfill the qualification process and extract the fields you defined in your schema.</p>
          
          <h2 className="text-2xl font-bold text-primary mt-8 mb-4">2. Data Processing and LLMs</h2>
          <p>We utilize third-party Large Language Models (LLMs) to process conversational logic. No PII (Personally Identifiable Information) collected during the conversation is used to train our base models or our partner models without explicit opt-in.</p>
          
          <h2 className="text-2xl font-bold text-primary mt-8 mb-4">3. Data Retention</h2>
          <p>Audio streams are processed in real-time and are discarded immediately after transcription. Text transcripts are retained for 30 days to allow you to review lead quality, after which they are permanently deleted unless you have an Enterprise retention policy enabled.</p>
          
          <h2 className="text-2xl font-bold text-primary mt-8 mb-4">4. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact our Data Protection Officer at privacy@ladeway.com.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
