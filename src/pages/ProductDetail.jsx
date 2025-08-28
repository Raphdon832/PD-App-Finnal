/* FILE: src/pages/ProductDetail.jsx */
import { Button } from "@/components/ui/button";
import { Pill } from "lucide-react";
import { currency } from "@/lib/utils";
export default function ProductDetail({ product, vendor, onVendor, onAdd, goBack }){
  if (!product) return <div>Product not found.</div>;
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
        {product.image ? <img src={product.image} alt={product.name} className="object-cover w-full h-full"/> : <Pill className="h-10 w-10 text-slate-400"/>}
      </div>
      <div className="space-y-3">
        
        <h2 className="text-xl font-semibold font-poppins tracking-tighter">{product.name}</h2>
        <div className="text-2xl font-bold font-poppins tracking-tighter">{currency(product.price)}</div>
        <div className="text-sm text-slate-600 font-poppins">Stock: {product.stock}</div>
        <p className="text-sm text-slate-700 font-poppins">{product.description || 'No description provided.'}</p>
        <div className="text-sm font-poppins">Vendor: <button className="text-sky-600 hover:underline" onClick={()=>onVendor(vendor?.id)}>{vendor?.name}</button></div>
        <div className="pt-2"><Button onClick={onAdd} className="w-full font-poppins">Add to cart</Button></div>
      </div>
    </div>
  );
}