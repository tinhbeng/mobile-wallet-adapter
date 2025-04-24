'use client'

import React from 'react'

export function LogView({ logs }: { logs: string[] }) {
  return (
    <div className="bg-neutral-900 text-sm p-4 rounded-md max-h-[300px] overflow-y-auto font-mono space-y-1 border border-neutral-700">
      {logs.length === 0 ? (
        <p className="text-neutral-400">No logs yet</p>
      ) : (
        logs.map((log, idx) => (
          <p key={idx} className="break-all text-neutral-200">
            {log}
          </p>
        ))
      )}
    </div>
  )
}
