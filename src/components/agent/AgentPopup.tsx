'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Agent } from '@/types'

interface AgentPopupProps {
  agent: Agent | null
  onClose: () => void
}

export default function AgentPopup({ agent, onClose }: AgentPopupProps) {
  if (!agent) return null

  const isWorking = agent.status === 'working'
  const isOpus = agent.model === 'opus'

  return (
    <AnimatePresence>
      {agent && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-gray-900 border-4 border-gray-600 rounded-lg p-6 w-80 max-w-[90vw]"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            onClick={e => e.stopPropagation()}
            style={{ imageRendering: 'pixelated' }}
          >
            {/* Emoji */}
            <div className="text-6xl text-center mb-3">{agent.emoji}</div>

            {/* Name */}
            <h2 className="text-2xl font-bold text-center mb-1" style={{ fontFamily: 'monospace' }}>
              {agent.name}
            </h2>

            {/* Role */}
            <p className="text-gray-400 text-center text-sm mb-3">{agent.role}</p>

            {/* Model badge */}
            <div className="flex justify-center mb-4">
              <span className={`px-3 py-1 rounded text-xs font-bold border-2 ${
                isOpus
                  ? 'bg-yellow-900/50 border-yellow-500 text-yellow-400'
                  : 'bg-gray-800 border-gray-500 text-gray-300'
              }`}>
                {agent.model.toUpperCase()}
              </span>
            </div>

            {/* Status */}
            <div className={`text-center py-2 rounded mb-3 font-bold ${
              isWorking ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'
            }`}>
              {isWorking ? '⚡ ПРАЦЮЄ' : '💤 БАЙДИКУЄ'}
            </div>

            {/* Current task */}
            {agent.current_task && (
              <div className="bg-gray-800 rounded p-2 mb-3 text-sm">
                <span className="text-gray-500">Завдання: </span>
                <span className="text-green-400">{agent.current_task}</span>
              </div>
            )}

            {/* Last active */}
            {agent.last_active && (
              <p className="text-xs text-gray-500 text-center mb-4">
                Остання активність: {new Date(agent.last_active).toLocaleString('uk-UA')}
              </p>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-full py-2 bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 rounded font-bold text-sm transition-colors"
            >
              ЗАКРИТИ
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
