/* FILE: src/pages/Checkout.jsx */
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/utils";
export default function Checkout({ total, onPlace, onCancel }){
  return (
    <div className="max-w-md mx-auto space-y-3">
      <h2 className="text-lg font-semibold">Confirm your order</h2>
      <div className="p-3 rounded-xl bg-slate-50 border">You’re about to place an order. Payment and logistics are mocked in this demo.</div>
      <div className="flex items-center justify-between">
        <div className="text-sm">Total</div><div className="text-xl font-bold">{currency(total)}</div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={onPlace}>Place order</Button>
        <Button className="flex-1" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}