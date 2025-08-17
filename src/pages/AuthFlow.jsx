import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import pdLogo from "@/assets/pd-logo.png";
import { ArrowLeft } from "lucide-react";
import MapPicker from "@/components/MapPicker";
import { createUser, signIn } from "@/lib/auth";

export default function AuthFlow({ role = "customer", onDone, onBack }) {
  const [mode, setMode] = useState("signup"); // "signup" | "signin"
  const isCustomer = role === "customer";

  const [name, setName] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [pin, setPin] = useState(null);

  const submit = async () => {
    try {
      if (mode === "signin") {
        if (!email.trim()) throw new Error("Enter your email");
        if (!password) throw new Error("Enter your password");
        const user = await signIn(email, password);
        if (user.role !== role) throw new Error(`This account is registered as ${user.role}`);
        onDone(user);
        return;
      }

      if (!name.trim()) throw new Error(isCustomer ? "Enter your display name" : "Enter contact name");
      if (!email.trim()) throw new Error("Enter your email");
      if (!password) throw new Error("Enter a password");

      if (isCustomer) {
        const user = await createUser({
          role: "customer",
          name: name.trim(),
          email,
          phone,
          password,
        });
        onDone(user);
      } else {
        if (!pharmacyName.trim()) throw new Error("Enter pharmacy name");
        if (!address.trim()) throw new Error("Enter pharmacy address");
        if (!pin?.lat || !pin?.lng) throw new Error("Tap the map to set the pharmacy location");
        const user = await createUser({
          role: "pharmacist",
          name: name.trim(),
          email,
          phone,
          password,
          pharmacyName: pharmacyName.trim(),
          pharmacyAddress: address.trim(),
          pharmacyLocation: { lat: pin.lat, lng: pin.lng },
        });
        onDone(user);
      }
    } catch (e) {
      alert(e.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] bg-watermark flex items-start sm:items-center justify-center">
      <div className="w-full max-w-md px-4 py-8 relative pt-12">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="absolute top-3 left-3 inline-flex items-center gap-2 px-3 py-2 rounded-full border bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Back</span>
          </button>
        )}

        <div className="text-center mb-6">
          <img src={pdLogo} alt="PD Logo" className="mx-auto h-16 mb-2" />
          <div className="tracking-[0.2em] text-base">HEALTHCARE AT YOUR DOORSTEP</div>
        </div>

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            variant={mode === "signup" ? "default" : "outline"}
            className="h-10"
            onClick={() => setMode("signup")}
          >
            Sign up
          </Button>
          <Button
            variant={mode === "signin" ? "default" : "outline"}
            className="h-10"
            onClick={() => setMode("signin")}
          >
            Sign in
          </Button>
        </div>

        <div className="space-y-4">
          {mode === "signup" ? (
            <>
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
                <div className="grid gap-2">
                  <Label className="tracking-wide">PHONE NUMBER</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 801 234 5678"
                    className="h-12 rounded-2xl text-base"
                  />
                </div>
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
                    <MapPicker
                      value={pin || { lat: 9.0765, lng: 7.3986 }}
                      onChange={setPin}
                      height={220}
                    />
                    <div className="text-xs text-slate-500">
                      {pin ? `Pinned: ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : "Tap map to drop a pin"}
                    </div>
                  </div>
                </>
              )}

              <div className="grid gap-2">
                <Label className="tracking-wide">PASSWORD</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-2xl text-base"
                />
              </div>

              <Button className="w-full h-12 rounded-2xl text-lg" onClick={submit}>
                {isCustomer ? "CREATE ACCOUNT" : "REGISTER PHARMACY"}
              </Button>
            </>
          ) : (
            <>
              <div className="grid gap-2">
                <Label className="tracking-wide">EMAIL</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 rounded-2xl text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label className="tracking-wide">PASSWORD</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-2xl text-base"
                />
              </div>
              <Button className="w-full h-12 rounded-2xl text-lg" onClick={submit}>
                SIGN IN
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
