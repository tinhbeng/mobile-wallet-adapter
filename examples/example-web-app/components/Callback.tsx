'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const url = new URL(window.location.href)
    const pubkey = url.searchParams.get('public_key') || url.searchParams.get('pubkey')
    if (pubkey) {
      router.replace(`/?public_key=${pubkey}`)
    } else {
      router.replace('/')
    }
  }, [router])

  return <p className="p-6">⏳ Redirecting back...</p>
}