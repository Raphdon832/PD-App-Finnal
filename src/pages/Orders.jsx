/* FILE: src/pages/Orders.jsx */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package } from "lucide-react";
import { currency } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";
export default function Orders({ orders, productById }){
  if (!orders.length) return <EmptyState title="No orders yet" body="Your past orders will show here." className="font-poppins tracking-tighter" icon={<Package className="h-8 w-8"/>} />;
  return (
    <div className="space-y-3 max-w-2xl mx-auto font-poppins tracking-tighter">
      {orders.map(o => (
        <Card key={o.id}>
          <CardHeader className="pb-2 font-poppins tracking-tighter">
            <CardTitle className="text-base tracking-tighter">Order #{o.id.slice(-6).toUpperCase()}</CardTitle>
            <CardDescription className="tracking-tighter">{new Date(o.createdAt).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 font-poppins tracking-tighter">
            {o.items.map(ci => {
              const p = productById(ci.productId);
              return (
                <div key={ci.id} className="text-sm flex items-center justify-between tracking-tighter">
                  <span className="truncate mr-2">{p?.name} × {ci.qty}</span>
                  <span className="font-medium tracking-tighter">{currency((p?.price||0)*ci.qty)}</span>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-2 border-t mt-2 tracking-tighter">
              <span className="text-sm font-poppins tracking-tighter">Total</span>
              <span className="font-semibold font-poppins tracking-tighter">{currency(o.total)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Always use order.id, order.customerId, order.pharmId, and items: [{ productId, qty, price }]
const OrderItem = ({ o, productById }) => {
  // Use o.customerId, o.pharmId, o.items
};
