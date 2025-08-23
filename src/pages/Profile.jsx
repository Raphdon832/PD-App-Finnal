/* FILE: src/pages/Profile.jsx */
import { useState, useEffect, useRef } from "react";
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
    email: myVendor?.email || me?.email || "",
    lat: myVendor?.lat ?? me?.pharmacyLocation?.lat ?? 9.0765,
    lng: myVendor?.lng ?? me?.pharmacyLocation?.lng ?? 7.3986,
  });
  const [editing, setEditing] = useState(false);
  const [initialProfile, setInitialProfile] = useState(profile);
  const [image, setImage] = useState(myVendor?.image || "");
  const [dp, setDp] = useState(myVendor?.dp || "");
  const [images, setImages] = useState(myVendor?.images || []);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const addressTimeout = useRef();

  useEffect(() => {
    if (myVendor) {
      setProfile((p) => ({
        ...p,
        name: myVendor.name || p.name,
        address: myVendor.address || p.address,
        contact: myVendor.contact || p.contact,
        email: myVendor.email || me?.email || p.email || "",
        lat: myVendor.lat ?? p.lat,
        lng: myVendor.lng ?? p.lng,
      }));
      setInitialProfile((p) => ({
        ...p,
        name: myVendor.name || p.name,
        address: myVendor.address || p.address,
        contact: myVendor.contact || p.contact,
        email: myVendor.email || me?.email || p.email || "",
        lat: myVendor.lat ?? p.lat,
        lng: myVendor.lng ?? p.lng,
      }));
      setDp(myVendor.dp || "");
      setImages(myVendor.images || []);
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

  // Address autocomplete effect
  useEffect(() => {
    if (!editing) return;
    if (!addressQuery.trim()) {
      setAddressResults([]);
      return;
    }
    setAddressLoading(true);
    clearTimeout(addressTimeout.current);
    addressTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&addressdetails=1&limit=5`
        );
        const data = await res.json();
        setAddressResults(data);
      } catch {
        setAddressResults([]);
      }
      setAddressLoading(false);
    }, 400);
    return () => clearTimeout(addressTimeout.current);
  }, [addressQuery, editing]);

  return (
    <div className="max-w-md mx-auto space-y-4 font-poppins tracking-tighter">
      <Card>
        <CardContent className="p-4 font-poppins tracking-tighter">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center mr-2">
                <div className="relative">
                  {dp ? (
                    <img src={dp} alt="DP" className="h-16 w-16 object-cover rounded-full" />
                  ) : (
                    <div className="h-16 w-16 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center text-slate-400">
                      {/* Dummy profile icon SVG */}
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="15" stroke="#cbd5e1" strokeWidth="2" fill="#f1f5f9" />
                        <circle cx="16" cy="13" r="5" fill="#cbd5e1" />
                        <ellipse cx="16" cy="23" rx="7" ry="4" fill="#cbd5e1" />
                      </svg>
                    </div>
                  )}
                  {me?.role === "pharmacist" && editing && (
                    <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 border cursor-pointer text-xs">
                      <span className="sr-only">Change DP</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const fr = new FileReader();
                          fr.onload = () => setDp(fr.result);
                          fr.readAsDataURL(f);
                        }}
                      />
                      ✎
                    </label>
                  )}
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tighter">{me?.name || 'Guest'}</div>
                <div className="text-sm text-slate-600 tracking-tighter">Role: {me?.role || 'customer'}</div>
                {me?.pharmacyName && <div className="text-sm text-slate-600 tracking-tighter">Pharmacy: {me.pharmacyName}</div>}
                {me?.role === "pharmacist" && (
                  <div className="text-sm text-slate-600 tracking-tighter flex items-center gap-1">
                    Email:
                    {editing ? (
                      <Input
                        type="email"
                        value={profile.email || ""}
                        onChange={e => setProfile(v => ({ ...v, email: e.target.value }))}
                        className="h-7 px-2 py-1 text-xs w-auto"
                        style={{ minWidth: 120 }}
                      />
                    ) : (
                      <span>{profile.email || "-"}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
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
            {/* Gallery for up to 3 images */}
            <div className="flex flex-col items-center gap-2 mb-2">
              <div className="flex gap-2">
                {images && images.length > 0 ? (
                  images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img} alt={`Pharmacy ${idx + 1}`} className="h-20 w-20 object-cover rounded-md" />
                      {editing && (
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-xs text-rose-600 group-hover:bg-white"
                          onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        >✕</button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400">No images uploaded</div>
                )}
                {editing && images.length < 3 && (
                  <label className="h-20 w-20 flex items-center justify-center border rounded-md bg-slate-100 text-blue-600 cursor-pointer hover:bg-slate-200">
                    <span className="text-2xl">+</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const fr = new FileReader();
                        fr.onload = () => setImages([...images, fr.result]);
                        fr.readAsDataURL(f);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
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
                <div className="relative">
                  <Input
                    value={profile.address}
                    readOnly={!editing}
                    onChange={e => {
                      setProfile(v => ({ ...v, address: e.target.value }));
                      setAddressQuery(e.target.value);
                    }}
                    placeholder="Type address..."
                    autoComplete="off"
                  />
                  {editing && addressQuery && addressResults.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 bg-white border rounded shadow mt-1 max-h-40 overflow-auto text-xs">
                      {addressResults.map((r, i) => (
                        <div
                          key={r.place_id}
                          className="px-3 py-2 cursor-pointer hover:bg-slate-100"
                          onClick={() => {
                            setProfile(v => ({
                              ...v,
                              address: r.display_name,
                              lat: parseFloat(r.lat),
                              lng: parseFloat(r.lon),
                            }));
                            setAddressQuery(r.display_name);
                            setAddressResults([]);
                          }}
                        >
                          {r.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                  {editing && addressLoading && (
                    <div className="absolute right-2 top-2 text-xs text-slate-400">Loading...</div>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Map Location</Label>
                <div className="relative z-0 overflow-hidden rounded-md border border-slate-200">
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
                    email: profile.email || "",
                    etaMins: myVendor?.etaMins ?? 30,
                    lat: profile.lat,
                    lng: profile.lng,
                    dp: dp || "",
                    images: images || [],
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
      <div className="flex justify-start mt-2">
        <button
          type="button"
          onClick={onLogout}
          className="text-xs font-poppins tracking-tighter px-4 py-1 border border-black-300 text-red-300 hover:text-red-400 focus:outline-none bg-transparent"
          style={{ boxShadow: "none", borderRadius: 5 }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}