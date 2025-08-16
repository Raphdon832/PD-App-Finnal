import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal } from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import ProductCard from "@/components/ProductCard";

export default function Home({ go, vendors, products, addToCart }){
  const [query, setQuery] = useState("");
  const newArrivals = useMemo(() => products.slice(0, 8), [products]);
  const filtered = useMemo(() => newArrivals.filter(p => p.name.toLowerCase().includes(query.toLowerCase())), [newArrivals, query]);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input className="pl-9" placeholder="Search medicines" value={query} onChange={(e)=>setQuery(e.target.value)} />
        </div>
        <Button variant="outline" onClick={()=>go('catalog')}><SlidersHorizontal className="h-4 w-4 mr-2"/>Filters</Button>
      </div>
      <div className="flex gap-2 overflow-x-auto py-1">
        {CATEGORIES.map(cat => (
          <Badge key={cat} variant="secondary" className="shrink-0 cursor-pointer" onClick={()=>go('catalog', { category: cat })}>{cat}</Badge>
        ))}
      </div>
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">New Arrivals</h3>
          <Button variant="ghost" size="sm" onClick={()=>go('catalog')}>View all</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(p => (
            <ProductCard key={p.id} p={p} vendor={vendors.find(v=>v.id===p.vendorId)} onOpen={()=>go('product',{id:p.id})} onAdd={()=>addToCart(p.id)} />
          ))}
        </div>
      </section>
    </div>
  );
}
