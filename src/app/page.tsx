'use client'

import { useState } from 'react'
import Header from '@/components/ui/Header'
import OfficeView from '@/components/office/OfficeView'
import DashboardPanel from '@/components/dashboard/DashboardPanel'
import AgentPopup from '@/components/agent/AgentPopup'
import type { Agent } from '@/types'

export default function Home() {
  const [dashboardOpen, setDashboardOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Header
        onToggleDashboard={() => setDashboardOpen(prev => !prev)}
        dashboardOpen={dashboardOpen}
      />
      <div className="pt-14 h-screen">
        <OfficeView onAgentClick={setSelectedAgent} />
      </div>
      <DashboardPanel open={dashboardOpen} onClose={() => setDashboardOpen(false)} />
      <AgentPopup agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  )
}
