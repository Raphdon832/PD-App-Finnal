/* FILE: src/pages/VendorDashboard.jsx */
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Pill, Trash2 } from "lucide-react";
import { CATEGORIES } from "@/lib/data";
export default function VendorDashboard({ me, products, myVendor, upsertVendor, addProduct, removeProduct, importFiles }){
  const [form, setForm] = useState({ name: '', price: '', stock: '', image: '', category: 'Therapeutic', description: '' });
  const fileInputRef = useRef(null);
  useEffect(() => { if (me?.role === 'pharmacist' && !myVendor) { upsertVendor({ id: Math.random().toString(36).slice(2,10), name: me.pharmacyName, bio: '', address: '', contact: '', etaMins: 30 }); } }, [me, myVendor, upsertVendor]);
  const myProducts = products.filter(p => myVendor && p.vendorId === myVendor.id);
  const onPickImage = (e) => { const f = e.target.files?.[0]; if (!f) return; const fr = new FileReader(); fr.onload = () => setForm(v => ({ ...v, image: fr.result })); fr.readAsDataURL(f); };
  const onSubmit = () => { if (!form.name.trim()) return alert('Enter product name'); addProduct({ ...form, price: Number(form.price)||0, stock: Number(form.stock)||0, vendorId: myVendor?.id, vendorName: myVendor?.name }); setForm({ name: '', price: '', stock: '', image: '', category: 'Therapeutic', description: '' }); };
  const onImport = async (files) => { const items = []; for (const f of files) { const text = await f.text(); if (f.name.endsWith('.csv')) items.push(...(await import("@/lib/utils")).parseCSV(text)); else if (f.name.endsWith('.xml')) items.push(...(await import("@/lib/utils")).parseXMLProducts(text)); } importFiles(items); };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Vendor Dashboard</h2>
        {myVendor && <Badge variant="secondary">{myVendor.name}</Badge>}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create product</CardTitle>
          <CardDescription>Add single items with image upload</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
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
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bulk import</CardTitle>
          <CardDescription>Upload CSV or XML (fields: name, price, stock, image, category, vendorName, description)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <input ref={fileInputRef} type="file" accept=".csv,.xml" multiple onChange={(e)=>{ onImport(Array.from(e.target.files||[])); e.target.value=''; }} />
            <Button variant="outline" onClick={()=>fileInputRef.current?.click()}><Upload className="h-4 w-4 mr-2"/>Choose files</Button>
          </div>
        </CardContent>
      </Card>
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Inventory</h3>
          <div className="text-xs text-slate-500">{myProducts.length} item(s)</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {myProducts.map(p => (
            <Card key={p.id}>
              <div className="aspect-square bg-slate-100 flex items-center justify-center rounded-t-xl overflow-hidden">
                {p.image ? <img src={p.image} alt={p.name} className="object-cover w-full h-full"/> : <Pill className="h-8 w-8 text-slate-400"/>}
              </div>
              <CardContent className="p-3 space-y-1">
                <div className="text-sm font-medium line-clamp-1">{p.name}</div>
                <div className="text-xs text-slate-500">₦{Number(p.price).toLocaleString()} • Stock {p.stock}</div>
                <div className="pt-1 flex gap-2">
                  <Button variant="outline" size="sm" onClick={()=>navigator?.clipboard?.writeText(p.id)}>Copy ID</Button>
                  <Button variant="ghost" size="sm" onClick={()=>removeProduct(p.id)}><Trash2 className="h-4 w-4 mr-1"/>Remove</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}