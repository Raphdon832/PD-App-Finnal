/* FILE: src/pages/Cart.jsx */
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pill, ShoppingCart, Trash2 } from "lucide-react";
import { currency } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";
export default function Cart({ cart, productById, setQty, removeLine, total, onCheckout }){
  if (!cart.length) return <EmptyState title="Your cart is empty" body="Browse products and add them to your cart." icon={<ShoppingCart className="h-8 w-8"/>} />;
  return (
    <div className="space-y-3 max-w-2xl mx-auto font-poppins tracking-tighter">
      {cart.map(ci => {
        // Always use product.id and product.pharmId for cart items
        const p = productById(ci.productId);
        return (
          <Card key={ci.id}>
            <CardContent className="p-3 flex items-center gap-3 font-poppins tracking-tighter">
              <div className="h-16 w-16 bg-slate-100 rounded-md overflow-hidden flex items-center justify-center">
                {p?.image ? <img src={p.image} alt={p.name} className="object-cover w-full h-full"/> : <Pill className="h-6 w-6 text-slate-400"/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium line-clamp-1 tracking-tighter">{p?.name}</div>
                <div className="text-xs text-slate-500 tracking-tighter">{currency(p?.price)} • Qty</div>
                <div className="flex items-center gap-2 mt-1">
                  <Input type="number" className="w-20 font-poppins tracking-tighter" value={ci.qty} onChange={(e)=>setQty(ci.id, Number(e.target.value||1))}/>
                  <Button variant="ghost" size="icon" onClick={()=>removeLine(ci.id)}><Trash2 className="h-4 w-4"/></Button>
                </div>
              </div>
              <div className="font-semibold tracking-tighter">{currency((p?.price||0) * ci.qty)}</div>
            </CardContent>
          </Card>
        );
      })}
      <div className="flex items-center justify-between pt-2 font-poppins tracking-tighter">
        <div className="text-sm text-slate-600">Total</div>
        <div className="text-xl font-bold">{currency(total)}</div>
      </div>
      <Button className="w-full font-poppins tracking-tighter" onClick={onCheckout}>Checkout</Button>
    </div>
  );
}