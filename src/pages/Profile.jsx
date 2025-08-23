/* FILE: src/pages/Profile.jsx */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MapPicker from "@/components/MapPicker";

export default function Profile({ me, myVendor, upsertVendor, onLogout }){
  const [connected, setConnected] = useState(false);
  const [profile, setProfile] = useState({
    name: myVendor?.name || me?.pharmacyName || "",
    address: myVendor?.address || me?.pharmacyAddress || "",
    contact: myVendor?.contact || me?.phone || "",
    lat: myVendor?.lat ?? me?.pharmacyLocation?.lat ?? 9.0765,
    lng: myVendor?.lng ?? me?.pharmacyLocation?.lng ?? 7.3986,
  });
  const [editing, setEditing] = useState(false);
  const [initialProfile, setInitialProfile] = useState(profile);

  useEffect(() => {
    if (myVendor) {
      setProfile((p) => ({
        ...p,
        name: myVendor.name || p.name,
        address: myVendor.address || p.address,
        contact: myVendor.contact || p.contact,
        lat: myVendor.lat ?? p.lat,
        lng: myVendor.lng ?? p.lng,
      }));
      setInitialProfile((p) => ({
        ...p,
        name: myVendor.name || p.name,
        address: myVendor.address || p.address,
        contact: myVendor.contact || p.contact,
        lat: myVendor.lat ?? p.lat,
        lng: myVendor.lng ?? p.lng,
      }));
    }
  }, [myVendor]);

  const isChanged = JSON.stringify(profile) !== JSON.stringify(initialProfile);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setConnected(true);
      } catch {}
    }
  };

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
      {me?.role === "pharmacist" && (
        <Card>
          <CardHeader className="font-poppins tracking-tighter">
            <CardTitle className="text-xl font-bold tracking-tighter">Vendor Profile</CardTitle>
            <CardDescription className="tracking-tighter">Edit your pharmacy details</CardDescription>
          </CardHeader>
          <CardContent className="font-poppins tracking-tighter space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div className="grid gap-2">
                <Label>Pharmacy Name</Label>
                <Input value={profile.name} readOnly={!editing} onChange={e => setProfile(v => ({ ...v, name: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Contact</Label>
                <Input value={profile.contact} readOnly={!editing} onChange={e => setProfile(v => ({ ...v, contact: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Address</Label>
                <Input value={profile.address} readOnly={!editing} onChange={e => setProfile(v => ({ ...v, address: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Map Location</Label>
                <div className="relative z-0 overflow-hidden rounded-md">
                  <MapPicker
                    value={{ lat: profile.lat, lng: profile.lng }}
                    onChange={editing ? (p => setProfile(v => ({ ...v, lat: p.lat, lng: p.lng }))) : undefined}
                    height={200}
                    className={`w-full${editing ? '' : ' opacity-60 pointer-events-none'}`}
                  />
                </div>
                <div className="text-xs text-slate-500">
                  {`Pinned: ${profile.lat.toFixed(5)}, ${profile.lng.toFixed(5)}`}
                </div>
              </div>
            </div>
            {!editing ? (
              <Button className="w-full" onClick={() => setEditing(true)}>
                Edit
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (!profile.name.trim()) return alert("Enter pharmacy name");
                  const v = {
                    ...(myVendor || {}),
                    id: (myVendor && myVendor.id) || `v_${Math.random().toString(36).slice(2,8)}`,
                    name: profile.name.trim(),
                    bio: myVendor?.bio || "",
                    address: profile.address.trim(),
                    contact: profile.contact.trim(),
                    etaMins: myVendor?.etaMins ?? 30,
                    lat: profile.lat,
                    lng: profile.lng,
                  };
                  upsertVendor(v);
                  setInitialProfile(profile);
                  setEditing(false);
                  alert("Vendor profile saved");
                }}
                className="w-full"
              >
                Save Profile
              </Button>
            )}
          </CardContent>
        </Card>
      )}
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