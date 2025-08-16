import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import ProductCard from "@/components/ProductCard";

export default function Catalog({ go, vendors, products, addToCart, initialCategory }){
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState(initialCategory || null);
  useEffect(() => { setActiveCat(initialCategory || null); }, [initialCategory]);
  const list = useMemo(() => products.filter(p => {
    const okQ = p.name.toLowerCase().includes(query.toLowerCase());
    const okC = activeCat ? p.category === activeCat : true;
    return okQ && okC;
  }), [products, query, activeCat]);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input className="pl-9" placeholder="Search all products" value={query} onChange={(e)=>setQuery(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Badge variant={activeCat===null? 'default':'secondary'} className="shrink-0 cursor-pointer" onClick={()=>setActiveCat(null)}>All</Badge>
        {CATEGORIES.map(cat => (
          <Badge key={cat} variant={activeCat===cat? 'default':'secondary'} className="shrink-0 cursor-pointer" onClick={()=>setActiveCat(cat)}>{cat}</Badge>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {list.map(p => (
          <ProductCard key={p.id} p={p} vendor={vendors.find(v=>v.id===p.vendorId)} onOpen={()=>go('product',{id:p.id})} onAdd={()=>addToCart(p.id)} />
        ))}
      </div>
    </div>
  );
}
