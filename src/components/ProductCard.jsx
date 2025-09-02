/* FILE: src/components/ProductCard.jsx */
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, Plus } from "lucide-react";
import { currency } from "@/lib/utils";
// Always use product.id and product.pharmId for product references
const ProductCard = ({ product, vendor, onOpen, onAdd }) => {
  return (
    <Card className="overflow-hidden group">
      <div className="aspect-square bg-slate-100 flex items-center justify-center">
        {product.image ? <img src={product.image} alt={product.name} className="object-cover w-full h-full"/> : <Pill className="h-8 w-8 text-slate-400"/>}
      </div>
      <CardContent className="p-3">
        <div className="text-xs text-slate-500 mb-1">{vendor?.name || '—'}</div>
        <div className="text-sm font-medium line-clamp-1">{product.name}</div>
        <div className="text-sm font-semibold">{currency(product.price)}</div>
        <div className="mt-2 flex items-center gap-2">
          <Button size="sm" className="flex-1" onClick={onOpen}>View</Button>
          <Button size="icon" variant="outline" onClick={onAdd}><Plus className="h-4 w-4"/></Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProductCard;