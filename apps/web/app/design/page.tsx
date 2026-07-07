"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Select } from "@/components/ui/Select"
import { Badge } from "@/components/ui/Badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Modal } from "@/components/ui/Modal"
import { Spinner } from "@/components/ui/Spinner"
import { Skeleton } from "@/components/ui/Skeleton"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table"

export default function DesignSystemPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-background p-8 font-sans text-secondary-900">
      <div className="mx-auto max-w-5xl space-y-12">
        
        <header className="border-b border-secondary-200 pb-4">
          <h1 className="text-3xl font-bold text-primary">Ladeway Design System</h1>
          <p className="mt-2 text-secondary-500">Component gallery and developer reference for Phase 18</p>
        </header>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Buttons</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default Size</Button>
            <Button size="lg">Large Size</Button>
            <Button size="icon" aria-label="Icon">+</Button>
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Badges (Lead Tiers & Status)</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Badge tier="HOT">HOT</Badge>
            <Badge tier="WARM">WARM</Badge>
            <Badge tier="COLD">COLD</Badge>
            <Badge tier="TRANSFERRED">TRANSFERRED</Badge>
            <Badge tier="ABANDONED">ABANDONED</Badge>
            <Badge tier="DEFAULT">DEFAULT / QUALIFYING</Badge>
          </div>
        </section>

        {/* Form Inputs */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Form Elements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Input</label>
              <Input placeholder="Enter something..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Disabled Input</label>
              <Input placeholder="Not allowed" disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select</label>
              <Select>
                <option>Option 1</option>
                <option>Option 2</option>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Textarea</label>
              <Textarea placeholder="Type a longer message here..." />
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-secondary-500">This is the default card layout with a header and content area. Used for dashboard metrics or lead summaries.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feedback / Loading */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Feedback & Loading</h2>
          <div className="flex items-center gap-8">
            <div className="space-y-2">
              <span className="text-sm font-medium block">Spinner</span>
              <Spinner className="h-6 w-6" />
            </div>
            <div className="space-y-2 w-64">
              <span className="text-sm font-medium block">Skeleton</span>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[80%]" />
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium block">Modal Trigger</span>
              <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
              <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                title="Example Modal"
              >
                <p className="text-sm text-secondary-600 mb-4">
                  This is a sample modal dialog demonstrating the backdrop and accessible focus.
                </p>
                <div className="flex justify-end">
                  <Button onClick={() => setIsModalOpen(false)}>Close</Button>
                </div>
              </Modal>
            </div>
          </div>
        </section>

        {/* Tables */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Tables</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead sortDirection="asc">Customer</TableHead>
                  <TableHead sortDirection="none">Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Acme Corp Logistics</TableCell>
                  <TableCell><Badge tier="HOT">HOT</Badge></TableCell>
                  <TableCell>TRANSFERRED</TableCell>
                  <TableCell className="text-right">92</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">John Doe</TableCell>
                  <TableCell><Badge tier="COLD">COLD</Badge></TableCell>
                  <TableCell>CLOSED</TableCell>
                  <TableCell className="text-right">45</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </section>

      </div>
    </div>
  )
}
