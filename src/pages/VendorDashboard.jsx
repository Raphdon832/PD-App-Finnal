import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import MapPicker from "@/components/MapPicker";
import { Upload, Trash2, Pill } from "lucide-react";

const CATEGORIES = [
  "Prescription Drugs",
  "Over-the-Counter",
  "Controlled Substances",
  "Therapeutic",
  "Syrup",
  "Target System",
];

const currency = (n) => `₦${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function VendorDashboard({
  me,
  products,
  myVendor,
  upsertVendor,
  addProduct,
  removeProduct,
  importFiles,
}) {
  const [form, setForm] = useState({ name: "", price: "", stock: "", image: "", category: "Therapeutic", description: "" });
  const [profile, setProfile] = useState({
    name: myVendor?.name || me?.pharmacyName || "",
    address: myVendor?.address || me?.pharmacyAddress || "",
    contact: myVendor?.contact || me?.phone || "",
    lat: myVendor?.lat ?? me?.pharmacyLocation?.lat ?? 9.0765,
    lng: myVendor?.lng ?? me?.pharmacyLocation?.lng ?? 7.3986,
  });

  useEffect(() => {
    if (me?.role === "pharmacist" && (!myVendor || !myVendor.id)) {
      const v = {
        id: myVendor?.id || `v_${Math.random().toString(36).slice(2, 8)}`,
        name: profile.name || me?.pharmacyName || "My Pharmacy",
        bio: myVendor?.bio || "",
        address: profile.address || "",
        contact: profile.contact || "",
        etaMins: 30,
        lat: profile.lat,
        lng: profile.lng,
      };
      upsertVendor(v);
    }
  }, [me]); // eslint-disable-line

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
    }
  }, [myVendor]);

  const myProducts = useMemo(() => products.filter((p) => myVendor && p.vendorId === myVendor.id), [products, myVendor]);

  const onPickImage = (e) => {
    const f = e.target.files?.[0]; if (!f) return; const fr = new FileReader(); fr.onload = () => setForm(v => ({ ...v, image: fr.result })); fr.readAsDataURL(f);
  };
  const onSubmit = () => {
    if (!form.name.trim()) return alert("Enter product name");
    if (!myVendor?.id) return alert("Save vendor profile first");
    addProduct({ ...form, price: Number(form.price) || 0, stock: Number(form.stock) || 0, vendorId: myVendor.id, vendorName: myVendor.name });
    setForm({ name: "", price: "", stock: "", image: "", category: "Therapeutic", description: "" });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Vendor Profile</h2>
          {myVendor && <Badge variant="secondary">{myVendor.name}</Badge>}
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Pharmacy Name</Label>
            <Input value={profile.name} onChange={(e)=>setProfile(v=>({...v, name:e.target.value}))} />
          </div>
          <div className="grid gap-2">
            <Label>Contact</Label>
            <Input value={profile.contact} onChange={(e)=>setProfile(v=>({...v, contact:e.target.value}))} />
          </div>
          <div className="md:col-span-2 grid gap-2">
            <Label>Address</Label>
            <Input value={profile.address} onChange={(e)=>setProfile(v=>({...v, address:e.target.value}))} />
          </div>
          <div className="md:col-span-2 grid gap-2">
            <Label>Map Location</Label>
            <MapPicker
              value={{ lat: profile.lat, lng: profile.lng }}
              onChange={(p)=>setProfile(v=>({...v, lat:p.lat, lng:p.lng}))}
              height={260}
            />
            <div className="text-xs text-slate-500">
              {`Pinned: ${profile.lat.toFixed(5)}, ${profile.lng.toFixed(5)}`}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={()=>{
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
              alert("Vendor profile saved");
            }}
          >
            Save Profile
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Create Product</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e)=>setForm(v=>({...v, name:e.target.value}))} placeholder="Ibuprofen 400mg" />
          </div>
          <div className="grid gap-2">
            <Label>Price (₦)</Label>
            <Input type="number" value={form.price} onChange={(e)=>setForm(v=>({...v, price:e.target.value}))} placeholder="2500" />
          </div>
          <div className="grid gap-2">
            <Label>Stock</Label>
            <Input type="number" value={form.stock} onChange={(e)=>setForm(v=>({...v, stock:e.target.value}))} placeholder="50" />
          </div>
          <div className="grid gap-2">
            <Label>Category</Label>
            <select className="border rounded-md px-3 py-2 text-sm" value={form.category} onChange={(e)=>setForm(v=>({...v, category:e.target.value}))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e)=>setForm(v=>({...v, description:e.target.value}))} placeholder="Brief product description" />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <input type="file" accept="image/*" onChange={onPickImage} />
            {form.image && <img src={form.image} alt="preview" className="h-16 w-16 object-cover rounded-md" />}
            <Button onClick={onSubmit} className="ml-auto">Add product</Button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Bulk import</h3>
        <div className="flex items-center gap-3">
          <input type="file" accept=".csv,.xml" multiple onChange={async (e)=>{
            const files = Array.from(e.target.files||[]);
            e.target.value = "";
            const items = [];
            for (const f of files) {
              const text = await f.text();
              if (f.name.endsWith(".csv")) {
                const rows = text.split(/\r?\n/).filter(Boolean);
                const header = rows.shift()?.split(",")||[];
                for (const line of rows) {
                  const cols = line.split(",");
                  const obj = {};
                  header.forEach((h, i)=> obj[h.trim()] = (cols[i]||"").trim());
                  items.push(obj);
                }
              } else if (f.name.endsWith(".xml")) {
                const doc = new DOMParser().parseFromString(text, "application/xml");
                const ps = Array.from(doc.querySelectorAll("product"));
                for (const p of ps) {
                  items.push({
                    name: p.querySelector("name")?.textContent || "",
                    price: p.querySelector("price")?.textContent || "",
                    stock: p.querySelector("stock")?.textContent || "",
                    image: p.querySelector("image")?.textContent || "",
                    category: p.querySelector("category")?.textContent || "",
                    vendorName: p.querySelector("vendorName")?.textContent || "",
                    description: p.querySelector("description")?.textContent || "",
                  });
                }
              }
            }
            importFiles(items);
          }} />
          <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Choose files</Button>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Inventory</h3>
          <div className="text-xs text-slate-500">{myProducts.length} item(s)</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {myProducts.map((p) => (
            <div key={p.id} className="border rounded-xl overflow-hidden">
              <div className="aspect-square bg-slate-100 flex items-center justify-center">
                {p.image ? <img src={p.image} alt={p.name} className="object-cover w-full h-full" /> : <Pill className="h-8 w-8 text-slate-400" />}
              </div>
              <div className="p-3 space-y-1">
                <div className="text-sm font-medium line-clamp-1">{p.name}</div>
                <div className="text-xs text-slate-500">{currency(p.price)} • Stock {p.stock}</div>
                <div className="pt-1 flex gap-2">
                  <Button variant="ghost" size="sm" onClick={()=>navigator?.clipboard?.writeText(p.id)} >Copy ID</Button>
                  <Button variant="ghost" size="sm" onClick={()=>removeProduct(p.id)}><Trash2 className="h-4 w-4 mr-1" />Remove</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
