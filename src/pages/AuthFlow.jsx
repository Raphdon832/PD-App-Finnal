import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import pdLogo from "@/assets/pd-logo.png";
import MapPicker from "@/components/MapPicker";

export default function AuthFlow({ role = "customer", onDone }) {
  const isCustomer = role === "customer";
  const [name, setName] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [pin, setPin] = useState(null);

  const submit = () => {
    if (!name.trim()) return alert(isCustomer ? "Enter your display name" : "Enter contact name");
    if (!email.trim()) return alert("Enter your email");
    if (isCustomer) {
      onDone({ id: `${Date.now()}`, role: "customer", name: name.trim() });
    } else {
      if (!pharmacyName.trim()) return alert("Enter pharmacy name");
      if (!address.trim()) return alert("Enter pharmacy address");
      if (!pin?.lat || !pin?.lng) return alert("Tap the map to set the pharmacy location");
      onDone({
        id: `${Date.now()}`,
        role: "pharmacist",
        name: name.trim(),
        pharmacyName: pharmacyName.trim(),
        pharmacyAddress: address.trim(),
        pharmacyLocation: { lat: pin.lat, lng: pin.lng },
        email,
        phone,
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] bg-watermark flex items-start sm:items-center justify-center">
      <div className="w-full max-w-md px-4 py-8">
        <div className="text-center mb-8">
          <img src={pdLogo} alt="PD" className="mx-auto h-20 w-auto" />
          <div className="tracking-[0.2em] text-base mt-2">HEALTHCARE AT YOUR DOORSTEP</div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label className="tracking-wide">{isCustomer ? "DISPLAY NAME" : "CONTACT NAME"}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isCustomer ? "Jane Doe" : "Full name"}
              className="h-12 rounded-2xl text-base"
            />
          </div>

          <div className="grid gap-2">
            <Label className="tracking-wide">EMAIL</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isCustomer ? "you@example.com" : "name@pharmacy.com"}
              className="h-12 rounded-2xl text-base"
            />
          </div>

          {isCustomer ? (
            <>
              <div className="grid gap-2">
                <Label className="tracking-wide">PHONE NUMBER</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 801 234 5678"
                  className="h-12 rounded-2xl text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label className="tracking-wide">CHOOSE PASSWORD</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-2xl text-base"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-2">
                <Label className="tracking-wide">PHARMACY NAME</Label>
                <Input
                  value={pharmacyName}
                  onChange={(e) => setPharmacyName(e.target.value)}
                  placeholder="HopeWell Pharmacy"
                  className="h-12 rounded-2xl text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label className="tracking-wide">PHONE NUMBER</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 801 234 5678"
                  className="h-12 rounded-2xl text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label className="tracking-wide">ADDRESS</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, Area, City"
                  className="h-12 rounded-2xl text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label className="tracking-wide">SET LOCATION ON MAP</Label>
                <MapPicker value={pin || { lat: 9.0765, lng: 7.3986 }} onChange={setPin} />
                <div className="text-xs text-slate-500">
                  {pin ? `Pinned: ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : "Tap map to drop a pin"}
                </div>
              </div>
            </>
          )}

          <Button className="w-full h-12 rounded-2xl text-lg" onClick={submit}>
            {isCustomer ? "SIGN UP" : "REGISTER"}
          </Button>
        </div>
      </div>
    </div>
  );
}
