"use client"

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Modal } from './Modal';

type HelpContext = 'admin' | 'chat';

interface HelpWidgetProps {
  context: HelpContext;
}

export function HelpWidget({ context }: HelpWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark hover:scale-110 transition-all duration-200 z-40 focus:outline-none focus:ring-4 focus:ring-primary/20"
        aria-label="Open Help Guide"
      >
        <Info size={24} />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={context === 'admin' ? 'Admin Console Guide' : 'AI Chat Demo Guide'}>
        <div className="space-y-4 text-sm text-secondary">
          {context === 'admin' && (
            <>
              <p>Welcome to the <strong>Ladeway Admin Console</strong>! Here is how to navigate the platform:</p>
              <ul className="space-y-3 list-disc pl-5 marker:text-primary/50">
                <li>
                  <strong className="text-primary">Overview & Analytics:</strong> Monitor your AI agents' high-level performance, chat volumes, and conversion velocity over time.
                </li>
                <li>
                  <strong className="text-primary">Leads Pipeline:</strong> View a Kanban-style CRM pipeline containing all users who chatted with your AI. Click any lead to see the full transcript and automatically extracted data.
                </li>
                <li>
                  <strong className="text-primary">Configurations:</strong> The heart of the platform. Build your AI personas, set specific <em>Qualification Fields</em> (like budget, timeline), and define <em>Scoring Rules</em> to automatically grade leads as HOT, WARM, or COLD based on the extracted data.
                </li>
                <li>
                  <strong className="text-primary">Settings:</strong> Update your workspace name, tenant configurations, and subdomains.
                </li>
              </ul>
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-primary font-medium mb-1">Quick Tip:</p>
                <p className="text-xs">Any changes made to your Configurations are instantly deployed to the AI agents live on your website.</p>
              </div>
            </>
          )}

          {context === 'chat' && (
            <>
              <p>Welcome to the <strong>Live AI Agent Demo</strong>!</p>
              <p>This page simulates exactly how your customers will interact with the AI agent you've configured.</p>
              <ul className="space-y-3 list-disc pl-5 marker:text-primary/50">
                <li>
                  <strong className="text-primary">Conversational AI:</strong> Chat naturally with the bot. It inherits the specific persona and tone you set in the Admin Console.
                </li>
                <li>
                  <strong className="text-primary">Data Extraction:</strong> During the chat, the AI will subtly steer the conversation to extract the qualification fields you requested (e.g., Email, Budget).
                </li>
                <li>
                  <strong className="text-primary">Auto-Scoring:</strong> Behind the scenes, the chat is continuously evaluated against your Scoring Rules. If conditions are met, the conversation is marked as a HOT lead.
                </li>
              </ul>
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-primary font-medium mb-1">Testing Tip:</p>
                <p className="text-xs">Try mentioning specific budgets, timelines, or constraints to see how the AI handles the conversation and scores you in the Leads pipeline!</p>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
