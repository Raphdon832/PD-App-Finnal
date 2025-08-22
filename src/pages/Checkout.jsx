/* FILE: src/pages/Checkout.jsx */
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/utils";
export default function Checkout({ total, onPlace, onCancel }){
  return (
    <div className="max-w-md mx-auto space-y-3 font-poppins tracking-tighter">
      <h2 className="text-lg font-semibold tracking-tighter">Confirm your order</h2>
      <div className="p-3 rounded-xl bg-slate-50 border tracking-tighter">You’re about to place an order. Payment and logistics are mocked in this demo.</div>
      <div className="flex items-center justify-between tracking-tighter">
        <div className="text-sm tracking-tighter">Total</div>
        <div className="text-xl font-bold tracking-tighter">{currency(total)}</div>
      </div>
      <div className="flex gap-2 tracking-tighter">
        <Button className="flex-1 font-poppins tracking-tighter" onClick={onPlace}>Place order</Button>
        <Button className="flex-1 font-poppins tracking-tighter" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}