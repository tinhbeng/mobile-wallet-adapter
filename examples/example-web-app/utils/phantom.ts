// utils/phantom.ts
import nacl from 'tweetnacl'
import bs58 from 'bs58'
import { Connection, PublicKey, SystemProgram, Transaction, clusterApiUrl } from '@solana/web3.js'

const NETWORK = clusterApiUrl('mainnet-beta')
const connection = new Connection(NETWORK)
let dappKeyPair: nacl.BoxKeyPair

function loadKeypairFromStorage(): nacl.BoxKeyPair | null {
  try {
    const raw = localStorage.getItem('dappKeyPair')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      publicKey: new Uint8Array(parsed.publicKey),
      secretKey: new Uint8Array(parsed.secretKey),
    }
  } catch {
    return null
  }
}

function saveKeypairToStorage(keypair: nacl.BoxKeyPair) {
  localStorage.setItem(
    'dappKeyPair',
    JSON.stringify({
      publicKey: Array.from(keypair.publicKey),
      secretKey: Array.from(keypair.secretKey),
    })
  )
}

const maybeSaved = typeof window !== 'undefined' && loadKeypairFromStorage()
if (maybeSaved) {
  dappKeyPair = maybeSaved
} else {
  dappKeyPair = nacl.box.keyPair()
  if (typeof window !== 'undefined') {
    saveKeypairToStorage(dappKeyPair)
  }
}

export { dappKeyPair }
export let sharedSecret: Uint8Array | undefined
export let session: string | undefined
export let phantomWalletPublicKey: PublicKey | undefined

export const setSharedSecret = (secret: Uint8Array) => {
  sharedSecret = secret
}

export const setSession = (s: string) => {
  session = s
}

export const setPublicKey = (key: PublicKey) => {
  phantomWalletPublicKey = key
}

export const buildUrl = (path: string, params: URLSearchParams) =>
  `https://phantom.app/ul/v1/${path}?${params.toString()}`

export const decryptPayload = (data: string, nonce: string, secret?: Uint8Array) => {
  if (!secret) throw new Error('missing shared secret')
  const decrypted = nacl.box.open.after(bs58.decode(data), bs58.decode(nonce), secret)
  if (!decrypted) throw new Error('decryption failed')
  return JSON.parse(Buffer.from(decrypted).toString('utf-8'))
}

export const encryptPayload = (payload: any, secret?: Uint8Array): [Uint8Array, Uint8Array] => {
  if (!secret) throw new Error('missing shared secret')
  const nonce = nacl.randomBytes(24)
  const encrypted = nacl.box.after(Buffer.from(JSON.stringify(payload)), nonce, secret)
  return [nonce, encrypted]
}

const redirectBase = typeof window !== 'undefined' ? window.location.origin : ''

export const connect = async (log: (msg: string) => void) => {
  const params = new URLSearchParams({
    dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
    cluster: 'mainnet-beta',
    app_url: 'https://phantom.app',
    redirect_link: `${redirectBase}/onConnect`,
  })
  window.location.href = buildUrl('connect', params)
}

export const disconnect = async (log: (msg: string) => void) => {
  const payload = { session }
  const [nonce, encrypted] = encryptPayload(payload, sharedSecret)
  const params = new URLSearchParams({
    dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
    nonce: bs58.encode(nonce),
    redirect_link: `${redirectBase}/onDisconnect`,
    payload: bs58.encode(encrypted),
  })
  window.location.href = buildUrl('disconnect', params)
}

const createTransferTransaction = async () => {
  if (!phantomWalletPublicKey) throw new Error('No public key')
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: phantomWalletPublicKey,
      toPubkey: phantomWalletPublicKey,
      lamports: 100,
    })
  )
  tx.feePayer = phantomWalletPublicKey
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  return tx
}

export const signTransaction = async (log: (msg: string) => void) => {
  const tx = await createTransferTransaction()
  const payload = { session, transaction: bs58.encode(tx.serialize({ requireAllSignatures: false })) }
  const [nonce, encrypted] = encryptPayload(payload, sharedSecret)
  const params = new URLSearchParams({
    dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
    nonce: bs58.encode(nonce),
    redirect_link: `${redirectBase}/onSignTransaction`,
    payload: bs58.encode(encrypted),
  })
  log('Signing transaction...')
  window.location.href = buildUrl('signTransaction', params)
}

export const signAllTransactions = async (log: (msg: string) => void) => {
  const txs = await Promise.all([createTransferTransaction(), createTransferTransaction()])
  const payload = {
    session,
    transactions: txs.map((tx) => bs58.encode(tx.serialize({ requireAllSignatures: false }))),
  }
  const [nonce, encrypted] = encryptPayload(payload, sharedSecret)
  const params = new URLSearchParams({
    dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
    nonce: bs58.encode(nonce),
    redirect_link: `${redirectBase}/onSignAllTransactions`,
    payload: bs58.encode(encrypted),
  })
  log('Signing multiple transactions...')
  window.location.href = buildUrl('signAllTransactions', params)
}

export const signAndSendTransaction = async (log: (msg: string) => void) => {
  const tx = await createTransferTransaction()
  const payload = { session, transaction: bs58.encode(tx.serialize({ requireAllSignatures: false })) }
  const [nonce, encrypted] = encryptPayload(payload, sharedSecret)
  const params = new URLSearchParams({
    dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
    nonce: bs58.encode(nonce),
    redirect_link: `${redirectBase}/onSignAndSendTransaction`,
    payload: bs58.encode(encrypted),
  })
  log('Signing and sending transaction...')
  window.location.href = buildUrl('signAndSendTransaction', params)
}

export const signMessage = async (log: (msg: string) => void) => {
  const payload = {
    session,
    message: bs58.encode(Buffer.from('Sign this message from WebApp')),
  }
  const [nonce, encrypted] = encryptPayload(payload, sharedSecret)
  const params = new URLSearchParams({
    dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
    nonce: bs58.encode(nonce),
    redirect_link: `${redirectBase}/onSignMessage`,
    payload: bs58.encode(encrypted),
  })
  log('Signing message...')
  window.location.href = buildUrl('signMessage', params)
}
