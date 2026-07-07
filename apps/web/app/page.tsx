import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AlertCircle } from 'lucide-react'

interface IndustryConfig {
  id: string
  industryName: string
  personaName: string
  greeting?: string
}

async function getConfigs(): Promise<{ configs: IndustryConfig[], error: boolean }> {
  const apiUrl = process.env.API_URL
  
  if (!apiUrl) {
    return { configs: [], error: true }
  }

  try {
    const res = await fetch(`${apiUrl}/industry-configs/public`, { cache: 'no-store' })
    if (!res.ok) {
      return { configs: [], error: true }
    }
    const data = await res.json()
    return { configs: data, error: false }
  } catch (err) {
    return { configs: [], error: true }
  }
}

export default async function LandingPage() {
  const { configs, error } = await getConfigs()

  const fallbackConfigs: IndustryConfig[] = [
    { id: 'demo-1', industryName: 'Logistics & Moving', personaName: 'Alexandra' },
    { id: 'demo-2', industryName: 'Real Estate', personaName: 'James' },
    { id: 'demo-3', industryName: 'Legal Services', personaName: 'Michael' },
  ]

  const displayConfigs = error || configs.length === 0 ? fallbackConfigs : configs

  return (
    <div className="min-h-screen bg-background text-secondary-900 font-sans flex flex-col">
      <header className="w-full border-b border-secondary-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary">Ladeway Engine</h1>
          <nav>
            <Link href="/design" className="text-sm font-medium text-secondary-500 hover:text-primary transition-colors">
              Design System
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto max-w-6xl px-4 py-16 flex flex-col items-center">
        <div className="text-center max-w-2xl mb-16">
          <h2 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl mb-4">
            One Engine. <br/> Infinite Industries.
          </h2>
          <p className="text-lg text-secondary-500">
            Select an industry demo below to experience the dynamic conversation flow.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex flex-col items-center max-w-md text-center">
            <div className="flex items-center text-yellow-800 mb-2 font-medium">
              <AlertCircle size={20} className="mr-2" />
              Backend starting up...
            </div>
            <p className="text-sm text-yellow-700 mb-4">
              We couldn't reach the API. Showing sample data while the server wakes up.
            </p>
            <Link href="/" replace>
              <Button variant="secondary" size="sm">Retry Connection</Button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {displayConfigs.map((config) => (
            <Card key={config.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary-50 text-primary flex items-center justify-center mb-4 text-xl font-bold">
                  {config.industryName.charAt(0)}
                </div>
                <CardTitle className="text-xl">{config.industryName}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-secondary-500 text-sm mb-6 flex-1">
                  Interact with <strong>{config.personaName}</strong>, the AI representative dynamically configured for the {config.industryName} domain.
                </p>
                <Link href={`/chat/${config.id}`} className="mt-auto block">
                  <Button className="w-full">Start Conversation</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-secondary-200 w-full text-center">
          <p className="text-lg font-medium text-secondary-600 italic">
            "Same AI engine. Different industries. Configured entirely through data — no code changes."
          </p>
        </div>
      </main>
      
      <footer className="w-full border-t border-secondary-200 bg-white py-8 text-center text-secondary-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Ladeway Conversation Engine. All rights reserved.</p>
      </footer>
    </div>
  )
}
