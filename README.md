# 🚀 Ladeway Platform

<div align="center">
  <img src="ladeway_logo_1783600265966.png" alt="Ladeway Logo" width="200" />
</div>

<p align="center">
  <strong>AI-Powered Conversational Qualification Platform</strong><br>
  <em>Turn conversations into highly qualified leads for any industry.</em>
</p>

<p align="center">
  <a href="https://ladeway-web-ten.vercel.app/"><strong>🔗 Live Demo: ladeway-web-ten.vercel.app</strong></a>
</p>

---

## 🌟 Overview

Ladeway is a multi-tenant, industry-agnostic SaaS platform that harnesses the power of AI to qualify leads through natural conversation. Whether you operate in logistics, real estate, insurance, or legal services, Ladeway allows you to configure an AI agent with a custom persona, define specific qualification fields, set scoring rules, and deploy a branded chat interface directly to your customers.

## ✨ Features

- **Multi-Tenant Architecture:** Securely isolated environments for different businesses.
- **Industry Agnostic:** Fully customizable AI personas and qualification rules.
- **Dynamic Lead Scoring:** Score leads in real-time based on conversation context and predefined rules.
- **Live Chat Widget:** Embeddable, customizable chat widget for seamless user interaction.
- **Real-Time Analytics:** Track lead volume, qualification rates, and conversation sentiment.
- **Role-Based Access Control:** Row-Level Security (RLS) ensuring data privacy.

## 🛠 Tech Stack

The platform is built on a modern, high-performance monorepo architecture:

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript
- **Database:** Neon PostgreSQL, Prisma ORM
- **Cache & Rate Limiting:** Upstash Redis
- **AI Inference:** Groq / Ollama / OpenAI
- **Deployment:** Vercel (Frontend), Render (Backend)

## 📁 Repository Structure

This project uses Turborepo for ultra-fast monorepo builds.

```text
ladeway/
├── apps/
│   ├── web/        → Next.js 14 Frontend Application
│   └── api/        → NestJS Backend API Services
├── packages/
│   └── types/      → Shared TypeScript definitions & models
├── prisma/         → Prisma schema, migrations, and seeds
├── turbo.json      → Turborepo pipeline configuration
└── package.json    → Root workspace configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL database
- Redis instance

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ahtisham992/Ladeway.git
   cd Ladeway
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment files and fill in your credentials.
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

4. **Setup Database:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npm run db:seed
   ```

5. **Start Development Servers:**
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000` and the API at `http://localhost:3001`.

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTORS.md](CONTRIBUTORS.md) for details on how you can help improve Ladeway.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
<div align="center">
  <p>Built with ❤️ by the Ladeway Team.</p>
</div>
