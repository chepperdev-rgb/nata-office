'use client'

import { useState } from 'react'
import Header from '@/components/ui/Header'
import OfficeGrid from '@/components/office/OfficeGrid'
import DashboardPanel from '@/components/dashboard/DashboardPanel'
import AgentPopup from '@/components/agent/AgentPopup'
import { useAgents } from '@/hooks/useAgents'
import { ROOMS } from '@/lib/constants'
import type { Agent } from '@/types'

export default function Home() {
  const [dashboardOpen, setDashboardOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const { agents } = useAgents()

  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>
      <Header
        onToggleDashboard={() => setDashboardOpen(prev => !prev)}
        dashboardOpen={dashboardOpen}
        workingCount={agents.filter(a => a.status === 'working').length}
        totalCount={agents.length}
      />
      <main className="pt-16 px-3 pb-8 max-w-[1200px] mx-auto">
        <OfficeGrid
          rooms={ROOMS}
          agents={agents}
          onAgentClick={setSelectedAgent}
        />
      </main>
      <DashboardPanel open={dashboardOpen} onClose={() => setDashboardOpen(false)} />
      <AgentPopup agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  )
}
