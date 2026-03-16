'use client'

import { motion } from 'framer-motion'
import RoomCard from './RoomCard'
import type { Agent, Room } from '@/types'

interface OfficeGridProps {
  rooms: Room[]
  agents: Agent[]
  onAgentClick: (agent: Agent) => void
}

export default function OfficeGrid({ rooms, agents, onAgentClick }: OfficeGridProps) {
  const getAgentsForRoom = (roomId: string) => agents.filter(a => a.room === roomId)

  return (
    <motion.div
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {rooms.map((room, i) => (
        <motion.div
          key={room.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35 }}
        >
          <RoomCard
            room={room}
            agents={getAgentsForRoom(room.id)}
            onAgentClick={onAgentClick}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
