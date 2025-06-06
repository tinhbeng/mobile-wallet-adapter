'use client'

import React, { useEffect, useState } from 'react'
import nacl from "tweetnacl";
import bs58 from "bs58";

type Wallet = 'phantom' | 'solflare'

const WALLET_DEEPLINKS: Record<Wallet, (redirect: string) => string> = {
  phantom: (redirect) =>
    `https://phantom.app/ul/v1/connect?app_url=${encodeURIComponent(redirect)}&redirect_link=${encodeURIComponent(`${redirect}/wallet/callback`)}`,
  solflare: (redirect) =>
    `solflare://wallet/connect?redirect_url=${encodeURIComponent(`${redirect}/wallet/callback`)}`,
}
const buildUrl = (path: string, params: URLSearchParams) =>
    `https://phantom.app/ul/v1/${path}?${params.toString()}`;
  
export function MobileWalletConnectButton() {
  const [publicKey, setPublicKey] = useState<string | null>(null)

  const [dappKeyPair] = useState(nacl.box.keyPair());

  const connect = async () => {
    const params = new URLSearchParams({
      dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
      cluster: "mainnet-beta",
      app_url: "https://phantom.app",
      redirect_link: onConnectRedirectLink,
    });

    const url = buildUrl("connect", params);
    Linking.openURL(url);
  };

  // ✅ Bắt public key từ URL sau khi redirect về
  useEffect(() => {
    const url = new URL(window.location.href)
    const key = url.searchParams.get('public_key') || url.searchParams.get('pubkey') || null
    if (key) {
      setPublicKey(key)
    }
  }, [])

  const handleConnect = (wallet: Wallet) => {
    const origin = window.location.origin
    const deeplink = WALLET_DEEPLINKS[wallet](origin)
    window.location.href = deeplink
  }

  return (
    <div className="space-y-4">
      {publicKey ? (
        <>
          <p className="text-sm text-gray-600">✅ Connected: {publicKey.slice(0, 6)}...{publicKey.slice(-4)}</p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => alert('Trigger signMessage logic ở đây')}
          >
            Sign Message
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => handleConnect('phantom')}
            className="w-full rounded-lg bg-[#551BF9] text-white px-4 py-2 font-medium"
          >
            Connect Phantom
          </button>
          <button
            onClick={() => handleConnect('solflare')}
            className="w-full rounded-lg bg-[#FFA500] text-white px-4 py-2 font-medium"
          >
            Connect Solflare
          </button>
        </>
      )}
    </div>
  )
}
