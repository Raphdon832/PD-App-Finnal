import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MapPicker from "@/components/MapPicker";
import { Pill } from "lucide-react";

export default function VendorProfile({ vendor, products, onMessage, onAddToCart }) {
  const [text, setText] = useState("");
  if (!vendor) return <div>Vendor not found.</div>;
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-lg font-semibold">{vendor.name}</div>
              <div className="text-sm text-slate-600">{vendor.bio}</div>
              <div className="text-xs text-slate-500">{vendor.address} • {vendor.contact}</div>
            </div>
            <Badge>{vendor.etaMins || 30} mins</Badge>
          </div>
          {typeof vendor.lat === "number" && typeof vendor.lng === "number" && (
            <MapPicker
              value={{ lat: vendor.lat, lng: vendor.lng }}
              readOnly
              height={200}
              zoom={14}
            />
          )}
          <div className="flex gap-2">
            <Input placeholder="Ask a question" value={text} onChange={(e)=>setText(e.target.value)} />
            <Button onClick={()=>{ if(text.trim()) { onMessage(vendor.id, text.trim()); setText(""); } }}>Send</Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="font-semibold mb-2">Products</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {products.map((p) => (
            <div key={p.id} className="border rounded-xl overflow-hidden">
              <div className="aspect-square bg-slate-100 flex items-center justify-center">
                {p.image ? <img src={p.image} alt={p.name} className="object-cover w-full h-full" /> : <Pill className="h-8 w-8 text-slate-400" />}
              </div>
              <div className="p-3">
                <div className="text-sm font-medium line-clamp-1">{p.name}</div>
                <div className="text-xs text-slate-500">₦{Number(p.price).toLocaleString()}</div>
                <div className="pt-2">
                  <Button size="sm" className="w-full" onClick={()=>onAddToCart(p.id)}>Add to cart</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
