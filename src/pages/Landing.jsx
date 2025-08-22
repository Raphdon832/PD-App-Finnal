/* FILE: src/pages/Landing.jsx */
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
export default function Landing({ onSelectRole }){
  return (
    <div className="max-w-md mx-auto font-poppins tracking-tighter">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl font-semibold tracking-tighter">Healthcare at Your Doorstep</h1>
        <p className="text-slate-600 text-sm tracking-tighter">Browse, chat with a pharmacist, and get medicines delivered fast.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card className="hover:shadow-md transition cursor-pointer font-poppins tracking-tighter" onClick={() => onSelectRole('customer')}>
          <CardHeader>
            <CardTitle className="text-base tracking-tighter">I’m a Customer</CardTitle>
            <CardDescription className="tracking-tighter">Discover products, add to cart, and order</CardDescription>
          </CardHeader>
        </Card>
        <Card className="hover:shadow-md transition cursor-pointer font-poppins tracking-tighter" onClick={() => onSelectRole('pharmacist')}>
          <CardHeader>
            <CardTitle className="text-base tracking-tighter">I’m a Pharmacist</CardTitle>
            <CardDescription className="tracking-tighter">Manage storefront, inventory and messages</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}