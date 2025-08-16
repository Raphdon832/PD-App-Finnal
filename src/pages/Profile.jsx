/* FILE: src/pages/Profile.jsx */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
export default function Profile({ me, onLogout }){
  const [connected, setConnected] = useState(false);
  const connectWallet = async () => { if (typeof window !== 'undefined' && window.ethereum) { try { await window.ethereum.request({ method: 'eth_requestAccounts' }); setConnected(true); } catch {} } };
  return (
    <div className="max-w-md mx-auto space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{me?.name || 'Guest'}</div>
              <div className="text-sm text-slate-600">Role: {me?.role || 'customer'}</div>
              {me?.pharmacyName && <div className="text-sm text-slate-600">Pharmacy: {me.pharmacyName}</div>}
            </div>
            <Button variant="outline" onClick={onLogout}>Log out</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wallet</CardTitle>
          <CardDescription>Connect MetaMask for future loyalty or payments</CardDescription>
        </CardHeader>
        <CardContent>
          {!connected ? (<Button onClick={connectWallet}>Connect MetaMask</Button>) : (<div className="text-sm text-emerald-600">Wallet connected</div>)}
        </CardContent>
      </Card>
    </div>
  );
}