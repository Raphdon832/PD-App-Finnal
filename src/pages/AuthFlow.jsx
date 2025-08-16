import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthFlow({ role = "customer", onDone }) {
  const isCustomer = role === "customer";
  const [name, setName] = useState("");
  const [pharmacy, setPharmacy] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");

  const submit = () => {
    if (!name.trim()) return alert("Enter your name");
    if (!email.trim()) return alert("Enter your email");
    if (isCustomer) {
      onDone({ id: `${Date.now()}`, role: "customer", name: name.trim() });
    } else {
      if (!pharmacy.trim()) return alert("Enter pharmacy name");
      onDone({ id: `${Date.now()}`, role: "pharmacist", name: name.trim(), pharmacyName: pharmacy.trim() });
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] bg-watermark flex items-start sm:items-center justify-center">
      <div className="w-full max-w-md px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-[64px] leading-none">PD</div>
          <div className="tracking-[0.2em] text-base">HEALTHCARE AT YOUR DOORSTEP</div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label className="tracking-wide">{
              isCustomer ? "DISPLAY NAME" : "PHARM NAME"
            }</Label>
            <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder={isCustomer ? "Jane Doe" : "HopeWell Pharmacy"} className="h-12 rounded-2xl text-base" />
          </div>

          {!isCustomer && (
            <div className="grid gap-2">
              <Label className="tracking-wide">EMAIL</Label>
              <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="name@pharmacy.com" className="h-12 rounded-2xl text-base" />
            </div>
          )}

          {isCustomer && (
            <div className="grid gap-2">
              <Label className="tracking-wide">EMAIL</Label>
              <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" className="h-12 rounded-2xl text-base" />
            </div>
          )}

          {!isCustomer && (
            <>
              <div className="grid gap-2">
                <Label className="tracking-wide">CATEGORY</Label>
                <select className="h-12 rounded-2xl border px-3 text-base">
                  <option>Retail Pharmacy</option>
                  <option>Hospital Pharmacy</option>
                  <option>Wholesale</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label className="tracking-wide">PHONE NUMBER</Label>
                <Input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="+234 801 234 5678" className="h-12 rounded-2xl text-base" />
              </div>
              <div className="grid gap-2">
                <Label className="tracking-wide">ADDRESS</Label>
                <Input value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="Kuje, Abuja" className="h-12 rounded-2xl text-base" />
              </div>
            </>
          )}

          {isCustomer && (
            <>
              <div className="grid gap-2">
                <Label className="tracking-wide">PHONE NUMBER</Label>
                <Input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="+234 801 234 5678" className="h-12 rounded-2xl text-base" />
              </div>
              <div className="grid gap-2">
                <Label className="tracking-wide">CHOOSE PASSWORD</Label>
                <Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" className="h-12 rounded-2xl text-base" />
              </div>
            </>
          )}

          {!isCustomer && (
            <div className="grid gap-2">
              <Label className="tracking-wide">PHARMACY NAME</Label>
              <Input value={pharmacy} onChange={(e)=>setPharmacy(e.target.value)} placeholder="HopeWell Pharmacy" className="h-12 rounded-2xl text-base" />
            </div>
          )}

          <Button className="w-full h-12 rounded-2xl text-lg" onClick={submit}>
            {isCustomer ? "SIGN UP" : "REGISTER"}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3">{
                isCustomer ? "SIGN UP USING" : "BY SIGNING UP, YOU AGREE TO OUR TERMS"
              }</span>
            </div>
          </div>

          {isCustomer && (
            <div className="grid gap-3">
              <Button variant="outline" className="h-12 rounded-2xl">GOOGLE</Button>
              <Button variant="outline" className="h-12 rounded-2xl">APPLE</Button>
            </div>
          )}

          <div className="text-center mt-6">
            <div className="inline-flex items-center gap-3 w-full">
              <span className="flex-1 border-t"></span>
              <span className="text-sm">ALREADY HAVE AN ACCOUNT?</span>
              <span className="flex-1 border-t"></span>
            </div>
            <div className="mt-3">
              <Button variant="outline" className="w-full h-12 rounded-2xl">SIGN IN</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// This code defines an authentication flow component for a pharmacy delivery app.
// It allows users to sign up as either customers or pharmacists, collecting necessary information such as name, email, phone number, and address.
// The component includes form validation and provides a button to submit the information.
// It also includes options for signing up with Google or Apple for customers, and a link   