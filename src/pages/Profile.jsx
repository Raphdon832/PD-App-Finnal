/* FILE: src/pages/Profile.jsx */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
export default function Profile({ me, onLogout }){
  const [connected, setConnected] = useState(false);
  const connectWallet = async () => { if (typeof window !== 'undefined' && window.ethereum) { try { await window.ethereum.request({ method: 'eth_requestAccounts' }); setConnected(true); } catch {} } };
  return (
    <div className="max-w-md mx-auto space-y-4 font-poppins tracking-tighter">
      <Card>
        <CardContent className="p-4 font-poppins tracking-tighter">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold tracking-tighter">{me?.name || 'Guest'}</div>
              <div className="text-sm text-slate-600 tracking-tighter">Role: {me?.role || 'customer'}</div>
              {me?.pharmacyName && <div className="text-sm text-slate-600 tracking-tighter">Pharmacy: {me.pharmacyName}</div>}
            </div>
            <Button variant="outline" onClick={onLogout} className="font-poppins tracking-tighter">Log out</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="font-poppins tracking-tighter">
          <CardTitle className="text-base tracking-tighter">Wallet</CardTitle>
          <CardDescription className="tracking-tighter">Connect MetaMask for future loyalty or payments</CardDescription>
        </CardHeader>
        <CardContent className="font-poppins tracking-tighter">
          {!connected ? (
            <Button onClick={connectWallet} className="font-poppins tracking-tighter">Connect MetaMask</Button>
          ) : (
            <div className="text-sm text-emerald-600 tracking-tighter">Wallet connected</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}