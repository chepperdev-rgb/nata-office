'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { ROOMS } from '@/lib/constants'
import { useAgents } from '@/hooks/useAgents'
import Room from './Room'
import type { Agent } from '@/types'

interface OfficeViewProps {
  onAgentClick: (agent: Agent) => void
}

export default function OfficeView({ onAgentClick }: OfficeViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentRoom, setCurrentRoom] = useState(0)
  const { agents } = useAgents()

  const scrollToRoom = useCallback((index: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: index * window.innerWidth, behavior: 'smooth' })
      setCurrentRoom(index)
    }
  }, [])

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const index = Math.round(scrollRef.current.scrollLeft / window.innerWidth)
      setCurrentRoom(index)
    }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true })
      return () => el.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const getAgentsForRoom = (roomId: string) => {
    return agents.filter(a => a.room === roomId)
  }

  return (
    <div className="relative h-full">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex h-full overflow-x-auto"
        style={{ scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}
      >
        {ROOMS.map(room => (
          <Room
            key={room.id}
            room={room}
            agents={getAgentsForRoom(room.id)}
            onAgentClick={onAgentClick}
          />
        ))}
      </div>

      {/* Left arrow */}
      {currentRoom > 0 && (
        <button
          onClick={() => scrollToRoom(currentRoom - 1)}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 bg-gray-900/80 border-2 border-gray-600 rounded flex items-center justify-center text-2xl hover:bg-gray-800 transition-colors"
        >
          ◀
        </button>
      )}

      {/* Right arrow */}
      {currentRoom < ROOMS.length - 1 && (
        <button
          onClick={() => scrollToRoom(currentRoom + 1)}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 bg-gray-900/80 border-2 border-gray-600 rounded flex items-center justify-center text-2xl hover:bg-gray-800 transition-colors"
        >
          ▶
        </button>
      )}

      {/* Room dots */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex gap-2">
        {ROOMS.map((room, i) => (
          <button
            key={room.id}
            onClick={() => scrollToRoom(i)}
            className={`w-3 h-3 rounded-full border-2 transition-all ${
              i === currentRoom
                ? 'border-white bg-white scale-125'
                : 'border-gray-500 bg-gray-700 hover:bg-gray-500'
            }`}
            title={room.name}
          />
        ))}
      </div>
    </div>
  )
}
