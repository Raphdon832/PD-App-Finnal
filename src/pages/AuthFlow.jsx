import React, { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import pdLogo from "@/assets/pd-logo.png";
import { ArrowLeft } from "lucide-react";
import MapPicker from "@/components/MapPicker";
import { signUpWithEmail, signInWithEmailAndEnsureProfile } from "@/lib/auth-firebase";

function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

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
        const { uid, role: userRole } = await signInWithEmailAndEnsureProfile({ email, password });
        if (userRole !== role) throw new Error(`This account is registered as ${userRole}`);
        if (userRole === "pharmacist") {
          onDone({
            uid,
            role: userRole,
            name: name.trim(),
            email,
            phone,
            pharmacyName: pharmacyName.trim(),
            pharmacyAddress: address.trim(),
            pharmacyLocation: pin ? { lat: pin.lat, lng: pin.lng } : undefined
          });
        } else {
          onDone({ uid, role: userRole, name: name.trim(), email, phone });
        }
        return;
      }
      if (!name.trim()) throw new Error(isCustomer ? "Enter your display name" : "Enter contact name");
      if (!email.trim() || !isValidEmail(email)) throw new Error("Enter a valid email");
      if (!password || password.length < 7) throw new Error("Password must be at least 7 characters");
      if (isCustomer) {
        const { uid, role: userRole } = await signUpWithEmail({ email, password, phone, role: "customer" });
        onDone({ uid, role: userRole, name: name.trim(), email, phone });
      } else {
        if (!pharmacyName.trim()) throw new Error("Enter pharmacy name");
        if (!address.trim()) throw new Error("Enter pharmacy address");
        if (!pin?.lat || !pin?.lng) throw new Error("Tap the map to set the pharmacy location");
        const { uid, role: userRole } = await signUpWithEmail({
          email,
          password,
          phone,
          role: "pharmacist"
        });
        onDone({
          uid,
          role: userRole,
          name: name.trim(),
          email,
          phone,
          pharmacyName: pharmacyName.trim(),
          pharmacyAddress: address.trim(),
          pharmacyLocation: { lat: pin.lat, lng: pin.lng }
        });
      }
    } catch (e) {
      alert(e.message || "Something went wrong");
    }
  };

  // ----- Segmented control (Sign up / Sign in) -----
  const segRef = useRef(null);
  const activeIndex = mode === "signup" ? 0 : 1;

  useEffect(() => {
    const el = segRef.current;
    if (!el) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        setMode((m) => (m === "signup" ? (e.key === "ArrowRight" ? "signin" : "signup") : (e.key === "ArrowLeft" ? "signup" : "signin")));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        // no-op; user can Tab to fields next
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-[calc(100vh-160px)] bg-watermark flex items-start sm:items-center justify-center font-poppins tracking-tighter">
      <div className="w-full max-w-md px-4 py-8 relative pt-12 font-poppins tracking-tighter">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="absolute top-3 left-3 inline-flex items-center gap-2 px-3 py-2 rounded-full border bg-white text-slate-700 hover:bg-slate-50 shadow-sm font-poppins tracking-tighter"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-poppins tracking-tighter">Back</span>
          </button>
        )}

        <div className="text-center mb-6 font-poppins tracking-tighter">
          <img src={pdLogo} alt="PD Logo" className="mx-auto h-16 mb-2" />
          <div className="tracking-[0.2em] text-base font-poppins tracking-tighter">HEALTHCARE AT YOUR DOORSTEP</div>
        </div>

        {/* Segmented Toggle */}
        <div
          ref={segRef}
          role="tablist"
          aria-label="Auth mode"
          tabIndex={0}
          className="relative mb-6 font-poppins tracking-tighter"
        >
          <div
            className="
              relative h-[26px] w-full rounded-[5px]
              bg-[#E7E7E7]
              border border-[#E7E7E7]
              overflow-hidden
            "
          >
            {/* sliding thumb */}
            <span
              aria-hidden="true"
              className={`
                absolute left-0 top-0 h-[26px] w-1/2 rounded-[5px]
                bg-white transition-transform duration-200 ease-out
                ${activeIndex === 0 ? "translate-x-0" : "translate-x-full"}
              `}
            />
            <div className="relative z-10 grid grid-cols-2 h-full font-poppins tracking-tighter">
              <button
                role="tab"
                aria-selected={mode === "signup"}
                type="button"
                onClick={() => setMode("signup")}
                className={`
                  text-xs font-semibold focus:outline-none font-poppins tracking-tighter
                  ${mode === "signup" ? "text-[#000000]" : "text-[#BCBCBC]"}
                `}
              >
                <div className="w-full h-full flex items-center justify-center font-poppins tracking-tighter">
                  SIGN UP
                </div>
              </button>
              <button
                role="tab"
                aria-selected={mode === "signin"}
                type="button"
                onClick={() => setMode("signin")}
                className={`
                  text-xs font-semibold focus:outline-none font-poppins tracking-tighter
                  ${mode === "signin" ? "text-[#000000]" : "text-[#BCBCBC]"}
                `}
              >
                <div className="w-full h-full flex items-center justify-center font-poppins tracking-tighter">
                  SIGN IN
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 font-poppins tracking-tighter">
          {mode === "signup" ? (
            <>
              <div className="grid gap-2 font-poppins tracking-tighter">
                <Label className="tracking-wide font-poppins tracking-tighter">{isCustomer ? "DISPLAY NAME" : "CONTACT NAME"}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isCustomer ? "Jane Doe" : "Full name"}
                  className="h-12 rounded-2xl text-base font-poppins tracking-tighter"
                />
              </div>

              <div className="grid gap-2 font-poppins tracking-tighter">
                <Label className="tracking-wide font-poppins tracking-tighter">EMAIL</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isCustomer ? "you@example.com" : "name@pharmacy.com"}
                  className="h-12 rounded-2xl text-base font-poppins tracking-tighter"
                />
              </div>

              {isCustomer ? (
                <div className="grid gap-2 font-poppins tracking-tighter">
                  <Label className="tracking-wide font-poppins tracking-tighter">PHONE NUMBER</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 801 234 5678"
                    className="h-12 rounded-2xl text-base font-poppins tracking-tighter"
                  />
                </div>
              ) : (
                <>
                  <div className="grid gap-2 font-poppins tracking-tighter">
                    <Label className="tracking-wide font-poppins tracking-tighter">PHARMACY NAME</Label>
                    <Input
                      value={pharmacyName}
                      onChange={(e) => setPharmacyName(e.target.value)}
                      placeholder="HopeWell Pharmacy"
                      className="h-12 rounded-2xl text-base font-poppins tracking-tighter"
                    />
                  </div>
                  <div className="grid gap-2 font-poppins tracking-tighter">
                    <Label className="tracking-wide font-poppins tracking-tighter">PHONE NUMBER</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 801 234 5678"
                      className="h-12 rounded-2xl text-base font-poppins tracking-tighter"
                    />
                  </div>
                  <div className="grid gap-2 font-poppins tracking-tighter">
                    <Label className="tracking-wide font-poppins tracking-tighter">ADDRESS</Label>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, Area, City"
                      className="h-12 rounded-2xl text-base font-poppins tracking-tighter"
                    />
                  </div>
                  <div className="grid gap-2 font-poppins tracking-tighter">
                    <Label className="tracking-wide font-poppins tracking-tighter">SET LOCATION ON MAP</Label>
                    <MapPicker
                      value={pin || { lat: 9.0765, lng: 7.3986 }}
                      onChange={setPin}
                      height={220}
                    />
                    <div className="text-xs text-slate-500 font-poppins tracking-tighter">
                      {pin ? `Pinned: ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : "Tap map to drop a pin"}
                    </div>
                  </div>
                </>
              )}

              <div className="grid gap-2 font-poppins tracking-tighter">
                <Label className="tracking-wide font-poppins tracking-tighter">PASSWORD</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-2xl text-base font-poppins tracking-tighter"
                />
              </div>

              <Button className="w-full h-12 rounded-2xl text-lg font-poppins tracking-tighter" onClick={submit}>
                {isCustomer ? "CREATE ACCOUNT" : "REGISTER PHARMACY"}
              </Button>
            </>
          ) : (
            <>
              <div className="grid gap-2 font-poppins tracking-tighter">
                <Label className="tracking-wide font-poppins tracking-tighter">EMAIL</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 rounded-2xl text-base font-poppins tracking-tighter"
                />
              </div>
              <div className="grid gap-2 font-poppins tracking-tighter">
                <Label className="tracking-wide font-poppins tracking-tighter">PASSWORD</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-2xl text-base font-poppins tracking-tighter"
                />
              </div>
              <Button className="w-full h-12 rounded-2xl text-lg font-poppins tracking-tighter" onClick={submit}>
                SIGN IN
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
