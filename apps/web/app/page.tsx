/**
 * Ladeway — Demo Landing Page (Placeholder for Phase 21)
 *
 * This page will be fully built in Phase 21 with two industry demo sections.
 * For now, it serves as a basic confirmation that the Next.js app is running.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          Ladeway
        </h1>
        <p className="mt-4 text-lg text-secondary">
          AI-Powered Conversational Qualification Platform
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className="inline-flex h-3 w-3 rounded-full bg-success animate-pulse" />
          <span className="text-sm font-medium text-secondary">
            Frontend running — Next.js 14 on port 3000
          </span>
        </div>
      </div>
    </main>
  );
}
