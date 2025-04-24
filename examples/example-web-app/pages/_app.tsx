// app/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import {
  connect,
  disconnect,
  signMessage,
  signTransaction,
  signAndSendTransaction,
  signAllTransactions,
  decryptPayload,
  dappKeyPair,
  sharedSecret,
  setSession,
  setSharedSecret,
  phantomWalletPublicKey,
  setPublicKey
} from '../utils/phantom'
import bs58 from 'bs58'
import nacl from 'tweetnacl'
import { PublicKey } from '@solana/web3.js'
import { usePathname, useSearchParams } from 'next/navigation'
import { LogView } from '../components/LogView'

export default function HomePage() {
  const [logs, setLogs] = useState<string[]>([])
  const addLog = (msg: string) => setLogs((prev) => [...prev, '> ' + msg])

  const params = useSearchParams()
  const pathname = usePathname()

  useEffect(() => {
    const data = params.get('data')
    const nonce = params.get('nonce')
    const error = params.get('errorCode')

    if (error) {
      addLog(`Error: ${error}`)
      return
    }

    if (!data || !nonce) return

    if (pathname?.includes('onConnect')) {
      const shared = nacl.box.before(
        bs58.decode(params.get('phantom_encryption_public_key')!),
        dappKeyPair.secretKey
      )

      const decrypted = decryptPayload(data, nonce, shared)

      setSharedSecret(shared)
      setSession(decrypted.session)
      setPublicKey(new PublicKey(decrypted.public_key))

      addLog(`✅ Connected: ${decrypted.public_key}`)
    }

    if (pathname?.includes('onDisconnect')) {
      addLog(`✅ Disconnected`)
    }

    if (pathname?.includes('onSignMessage')) {
      const msg = decryptPayload(data, nonce, sharedSecret)
      addLog(`📩 Signed Message: ${JSON.stringify(msg)}`)
    }

    if (pathname?.includes('onSignTransaction')) {
      const result = decryptPayload(data, nonce, sharedSecret)
      addLog(`🔏 Signed Transaction: ${JSON.stringify(result)}`)
    }

    if (pathname?.includes('onSignAllTransactions')) {
      const result = decryptPayload(data, nonce, sharedSecret)
      addLog(`📄 Signed All Transactions: ${JSON.stringify(result)}`)
    }

    if (pathname?.includes('onSignAndSendTransaction')) {
      const result = decryptPayload(data, nonce, sharedSecret)
      addLog(`🚀 Signed and Sent Transaction: ${JSON.stringify(result)}`)
    }
  }, [params, pathname])

  return (
    <main className="min-h-screen bg-black text-white p-6 space-y-4">
      <h1 className="text-xl font-bold">Phantom Deeplink Web Demo</h1>
      <div className="flex flex-col gap-2">
        <button className="btn" onClick={() => connect(addLog)}>Connect</button>
        <button className="btn" onClick={() => disconnect(addLog)}>Disconnect</button>
        <button className="btn" onClick={() => signTransaction(addLog)}>Sign Transaction</button>
        <button className="btn" onClick={() => signAllTransactions(addLog)}>Sign All Transactions</button>
        <button className="btn" onClick={() => signAndSendTransaction(addLog)}>Sign & Send Transaction</button>
        <button className="btn" onClick={() => signMessage(addLog)}>Sign Message</button>
      </div>
      <LogView logs={logs} />
    </main>
  )
}
