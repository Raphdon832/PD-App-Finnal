import React, { useEffect, useState } from "react";
import { listenToProfiles } from "@/lib/firebase-profiles";
import { listenToProducts } from "@/lib/firebase-products";
import { listenToOrders } from "@/lib/firebase-orders";

export default function SuperDashboard() {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const unsubUsers = listenToProfiles(setUsers);
    const unsubProducts = listenToProducts(setProducts);
    const unsubOrders = listenToOrders(setOrders);
    return () => {
      unsubUsers && unsubUsers();
      unsubProducts && unsubProducts();
      unsubOrders && unsubOrders();
    };
  }, []);

  // Prevent all copy and text selection
  useEffect(() => {
    const prevent = e => e.preventDefault();
    document.addEventListener('copy', prevent, true);
    document.addEventListener('selectstart', prevent, true);
    return () => {
      document.removeEventListener('copy', prevent, true);
      document.removeEventListener('selectstart', prevent, true);
    };
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
      <h1 className="text-2xl font-bold mb-6">Super User Dashboard</h1>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Role</th>
                <th className="p-2 border">Phone</th>
                <th className="p-2 border">Super?</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.uid} className="odd:bg-white even:bg-slate-50">
                  <td className="p-2 border">{u.uid}</td>
                  <td className="p-2 border">{u.name}</td>
                  <td className="p-2 border">{u.email}</td>
                  <td className="p-2 border">{u.role}</td>
                  <td className="p-2 border">{u.phone}</td>
                  <td className="p-2 border">{u.isSuper ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Products</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Vendor</th>
                <th className="p-2 border">Price</th>
                <th className="p-2 border">Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="odd:bg-white even:bg-slate-50">
                  <td className="p-2 border">{p.id}</td>
                  <td className="p-2 border">{p.name}</td>
                  <td className="p-2 border">{p.pharmId}</td>
                  <td className="p-2 border">{p.price}</td>
                  <td className="p-2 border">{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">User</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border">Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="odd:bg-white even:bg-slate-50">
                  <td className="p-2 border">{o.id}</td>
                  <td className="p-2 border">{o.customerId || o.pharmId}</td>
                  <td className="p-2 border">{o.total}</td>
                  <td className="p-2 border">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
