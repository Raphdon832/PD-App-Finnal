/* FILE: src/lib/data.js */
export const CATEGORIES = ["Prescription Drugs","Over‑the‑Counter","Controlled Substances","Therapeutic","Syrup","Target System"];
export const seedVendors = [
  { id: 'v_zen', name: 'ZenCare Pharmacy', bio: 'Community pharmacy focused on fast delivery in Kuje.', address: 'Kuje, Abuja', contact: '+234 801 234 5678', etaMins: 35 },
  { id: 'v_green', name: 'GreenLeaf Pharma', bio: 'Affordable generics and OTC.', address: 'Garki, Abuja', contact: '+234 902 111 2233', etaMins: 40 },
];
export const seedProducts = [
  { id: Math.random().toString(36).slice(2,10), name: 'Paracetamol 500mg', price: 1200, stock: 40, image: '', category: 'Over‑the‑Counter', vendorId: 'v_zen', description: 'Pain relief tablets 500mg (x20).'},
  { id: Math.random().toString(36).slice(2,10), name: 'Amoxicillin 500mg', price: 3800, stock: 18, image: '', category: 'Prescription Drugs', vendorId: 'v_green', description: 'Broad‑spectrum antibiotic, consult pharmacist.'},
  { id: Math.random().toString(36).slice(2,10), name: 'Cough Syrup (Dextromethorphan)', price: 2950, stock: 25, image: '', category: 'Syrup', vendorId: 'v_zen', description: 'Non‑drowsy cough relief 100ml.'},
  { id: Math.random().toString(36).slice(2,10), name: 'Vitamin C 1000mg', price: 2100, stock: 100, image: '', category: 'Therapeutic', vendorId: 'v_green', description: 'Immune support tablets (x60).'},
];