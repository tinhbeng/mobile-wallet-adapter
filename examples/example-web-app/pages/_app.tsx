import { MobileWalletConnectButton } from "../components/ConnectButton";


export default function Page() {
  return (
    <main className="p-6 max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-4">Connect Wallet</h1>
      <MobileWalletConnectButton />
    </main>
  )
}