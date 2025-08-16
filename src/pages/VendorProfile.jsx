import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";

export default function VendorProfile({ vendor, products, onMessage, onAddToCart }){
  const [text, setText] = useState('');
  if (!vendor) return <div>Vendor not found.</div>;
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{vendor.name}</div>
              <div className="text-sm text-slate-600">{vendor.bio}</div>
              <div className="text-xs text-slate-500">{vendor.address} • {vendor.contact}</div>
            </div>
            <Badge>{vendor.etaMins} mins</Badge>
          </div>
          <div className="mt-3 flex gap-2">
            <Input placeholder="Ask a question" value={text} onChange={(e)=>setText(e.target.value)} />
            <Button onClick={()=>{ if(text.trim()) { onMessage(vendor.id, text.trim()); setText(''); } }}>Send</Button>
          </div>
        </CardContent>
      </Card>
      <div>
        <h3 className="font-semibold mb-2">Products</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map(p => (
            <ProductCard key={p.id} p={p} vendor={vendor} onOpen={()=>{}} onAdd={()=>onAddToCart(p.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
