import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home as HomeIcon,
  ShoppingCart,
  MessageSquare,
  User2,
  Store,
  Package,
  MapPin,
  Timer,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { loadFromLS, saveToLS, uid } from "@/lib/utils";
import { seedVendors as baseSeedVendors, seedProducts } from "@/lib/data";
import pdLogo from "@/assets/pd-logo.png";

import Landing from "@/pages/Landing";
import AuthFlow from "@/pages/AuthFlow";
import Home from "@/pages/Home";
import Catalog from "@/pages/Catalog";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import Messages from "@/pages/Messages";
import VendorDashboard from "@/pages/VendorDashboard";
import VendorProfile from "@/pages/VendorProfile";
import Profile from "@/pages/Profile";

/* --- helpers for geolocation + ETA --- */
const toRad = (d) => (d * Math.PI) / 180;
function haversineKm(a, b) {
  if (!a || !b) return null;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function etaMinutes(distanceKm) {
  if (distanceKm == null) return null;
  const avgKmh = 22;
  const prep = 8;
  const mins = prep + (distanceKm / avgKmh) * 60;
  return Math.max(5, Math.min(90, Math.round(mins)));
}

/* add rough coords to seed vendors (Abuja areas) */
const seedVendors = baseSeedVendors.map((v) => {
  if (v.name.includes("ZenCare")) return { ...v, lat: 8.854, lng: 7.227 };   // Kuje
  if (v.name.includes("GreenLeaf")) return { ...v, lat: 9.030, lng: 7.488 }; // Garki
  return v;
});

export default function App() {
  const [state, setState] = React.useState(() =>
    loadFromLS("PD_STATE", {
      screen: "landing",
      screenParams: {},
      me: null,
      vendors: seedVendors,
      products: seedProducts,
      cart: [],
      orders: [],
      threads: {},
      toasts: [],
      userLoc: null, // {lat, lng}
    })
  );
  React.useEffect(() => saveToLS("PD_STATE", state), [state]);

  /* get current browser location once */
  React.useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setState((s) => ({ ...s, userLoc: { lat: latitude, lng: longitude } }));
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 }
    );
  }, []);

  const me = state.me;
  const go = (screen, screenParams = {}) =>
    setState((s) => ({ ...s, screen, screenParams }));
  const toast = (msg, type = "info") => {
    const id = uid();
    setState((s) => ({ ...s, toasts: [...s.toasts, { id, msg, type }] }));
    setTimeout(
      () =>
        setState((s) => ({
          ...s,
          toasts: s.toasts.filter((t) => t.id !== id),
        })),
      2500
    );
  };

  const vendorById = (id) => state.vendors.find((v) => v.id === id);
  const productById = (id) => state.products.find((p) => p.id === id);

  /* choose a target vendor (current screen's vendor, else nearest) */
  const targetVendor = React.useMemo(() => {
    if (state.screen === "vendorProfile" && state.screenParams.id) {
      return vendorById(state.screenParams.id);
    }
    if (state.screen === "product" && state.screenParams.id) {
      const p = productById(state.screenParams.id);
      if (p) return vendorById(p.vendorId);
    }
    if (!state.userLoc) return null;
    let best = null;
    let bestD = Infinity;
    for (const v of state.vendors) {
      if (typeof v.lat !== "number" || typeof v.lng !== "number") continue;
      const d = haversineKm(state.userLoc, { lat: v.lat, lng: v.lng });
      if (d != null && d < bestD) {
        best = v;
        bestD = d;
      }
    }
    return best;
  }, [state.screen, state.screenParams, state.vendors, state.userLoc]);

  const distanceKm = React.useMemo(() => {
    if (!state.userLoc || !targetVendor) return null;
    if (targetVendor.lat == null || targetVendor.lng == null) return null;
    return haversineKm(state.userLoc, {
      lat: targetVendor.lat,
      lng: targetVendor.lng,
    });
  }, [state.userLoc, targetVendor]);

  const dynamicEta = etaMinutes(distanceKm);

  const addToCart = (productId) =>
    setState((s) => {
      const p = s.products.find((p) => p.id === productId);
      if (!p) return s;
      const existing = s.cart.find((ci) => ci.productId === productId);
      let cart;
      if (existing)
        cart = s.cart.map((ci) =>
          ci.productId === productId
            ? { ...ci, qty: Math.min(ci.qty + 1, p.stock) }
            : ci
        );
      else cart = [...s.cart, { id: uid(), productId, vendorId: p.vendorId, qty: 1 }];
      return { ...s, cart };
    });

  const setQty = (lineId, qty) =>
    setState((s) => ({
      ...s,
      cart: s.cart.map((ci) =>
        ci.id === lineId ? { ...ci, qty: Math.max(1, qty) } : ci
      ),
    }));
  const removeLine = (lineId) =>
    setState((s) => ({ ...s, cart: s.cart.filter((ci) => ci.id !== lineId) }));

  const checkout = () =>
    setState((s) => {
      if (!s.cart.length) return s;
      const total = s.cart.reduce((sum, ci) => {
        const p = s.products.find((p) => p.id === ci.productId);
        return sum + (p ? p.price * ci.qty : 0);
      }, 0);
      const order = { id: uid(), items: s.cart, total, createdAt: new Date().toISOString() };
      toast("Order placed. Pharmacist will confirm shortly.", "success");
      return { ...s, orders: [order, ...s.orders], cart: [], screen: "orders" };
    });

  const upsertVendor = (v) =>
    setState((s) => {
      const exists = s.vendors.some((x) => x.id === v.id);
      const vendors = exists
        ? s.vendors.map((x) => (x.id === v.id ? v : x))
        : [...s.vendors, v];
      return { ...s, vendors };
    });

  const addProduct = (p) =>
    setState((s) => ({ ...s, products: [{ ...p, id: uid() }, ...s.products] }));
  const removeProduct = (pid) =>
    setState((s) => ({
      ...s,
      products: s.products.filter((p) => p.id !== pid),
    }));

  const sendMessage = (vendorId, from, text) =>
    setState((s) => {
      const thread = s.threads[vendorId] || [];
      const msg = { id: uid(), from, text, at: new Date().toISOString() };
      return { ...s, threads: { ...s.threads, [vendorId]: [...thread, msg] } };
    });

  const cartTotal = state.cart.reduce((sum, ci) => {
    const p = productById(ci.productId);
    return sum + (p ? p.price * ci.qty : 0);
  }, 0);

  const Screens = {
    landing: <Landing onSelectRole={(role) => go("auth", { role })} />,
    auth: (
      <AuthFlow
        role={state.screenParams.role}
        onDone={(user) =>
          setState((s) => ({
            ...s,
            me: user,
            screen: user.role === "customer" ? "home" : "vendorDashboard",
          }))
        }
      />
    ),
    home: (
      <Home
        go={go}
        vendors={state.vendors}
        products={state.products}
        addToCart={(id) => {
          addToCart(id);
          toast("Added to cart");
        }}
      />
    ),
    catalog: (
      <Catalog
        go={go}
        vendors={state.vendors}
        products={state.products}
        addToCart={(id) => {
          addToCart(id);
          toast("Added to cart");
        }}
        initialCategory={state.screenParams.category}
      />
    ),
    product: (
      <ProductDetail
        product={productById(state.screenParams.id)}
        vendor={vendorById(productById(state.screenParams.id)?.vendorId)}
        onVendor={(id) => go("vendorProfile", { id })}
        onAdd={() => {
          addToCart(state.screenParams.id);
          toast("Added to cart");
        }}
      />
    ),
    cart: (
      <Cart
        cart={state.cart}
        productById={productById}
        setQty={setQty}
        removeLine={removeLine}
        total={cartTotal}
        onCheckout={() => checkout()}
      />
    ),
    checkout: <Checkout total={cartTotal} onPlace={checkout} onCancel={() => go("cart")} />,
    orders: <Orders orders={state.orders} productById={productById} />,
    messages: (
      <Messages
        vendors={state.vendors}
        threads={state.threads}
        onOpenVendor={(id) => go("vendorProfile", { id })}
        onSend={(vendorId, text) => sendMessage(vendorId, "me", text)}
      />
    ),
    vendorDashboard: (
      <VendorDashboard
        me={state.me}
        products={state.products}
        myVendor={
          state.me
            ? state.vendors.find((v) =>
                state.me.role === "pharmacist" ? v.name === state.me.pharmacyName : false
              )
            : null
        }
        upsertVendor={upsertVendor}
        addProduct={addProduct}
        removeProduct={removeProduct}
        importFiles={(items) => {
          let added = 0;
          let createdVendors = 0;
          setState((s) => {
            let vendors = [...s.vendors];
            let products = [...s.products];
            for (const it of items) {
              let vendorId = it.vendorId;
              if (!vendorId) {
                const vName = it.vendorName || state.me?.pharmacyName || "My Pharmacy";
                let v = vendors.find((v) => v.name === vName);
                if (!v) {
                  v = { id: uid(), name: vName, bio: "", address: "", contact: "", etaMins: 30, lat: null, lng: null };
                  vendors.push(v);
                  createdVendors++;
                }
                vendorId = v.id;
              }
              products.unshift({
                id: uid(),
                name: it.name || "Unnamed",
                price: Number(it.price) || 0,
                stock: Number(it.stock) || 0,
                image: it.image || "",
                category: it.category || "Therapeutic",
                vendorId,
                description: it.description || "",
              });
              added++;
            }
            return { ...s, vendors, products };
          });
          toast(`Imported ${added} item(s)` + (createdVendors ? `, ${createdVendors} vendor(s)` : ""));
        }}
      />
    ),
    vendorProfile: (
      <VendorProfile
        vendor={vendorById(state.screenParams.id)}
        products={state.products.filter((p) => p.vendorId === state.screenParams.id)}
        onMessage={(id, text) => sendMessage(id, "me", text)}
        onAddToCart={(id) => {
          addToCart(id);
          toast("Added to cart");
        }}
      />
    ),
    profile: <Profile me={me} onLogout={() => setState((s) => ({ ...s, me: null, screen: "landing" }))} />,
  };

  const showBottomNav = state.screen !== "landing" && state.screen !== "auth";

  const bottomTabs = me?.role === "pharmacist"
    ? [
        { key: "vendorDashboard", label: "Dashboard", icon: <Store className="h-5 w-5" />, onClick: () => go("vendorDashboard") },
        { key: "orders", label: "Orders", icon: <Package className="h-5 w-5" />, onClick: () => go("orders") },
        { key: "messages", label: "Messages", icon: <MessageSquare className="h-5 w-5" />, onClick: () => go("messages") },
        { key: "profile", label: "Profile", icon: <User2 className="h-5 w-5" />, onClick: () => go("profile") },
      ]
    : [
        { key: "home", label: "Home", icon: <HomeIcon className="h-5 w-5" />, onClick: () => go("home") },
        { key: "orders", label: "Orders", icon: <Package className="h-5 w-5" />, onClick: () => go("orders") },
        { key: "messages", label: "Messages", icon: <MessageSquare className="h-5 w-5" />, onClick: () => go("messages") },
        { key: "cart", label: "Cart", icon: <ShoppingCart className="h-5 w-5" />, onClick: () => go("cart") },
        { key: "profile", label: "Profile", icon: <User2 className="h-5 w-5" />, onClick: () => go("profile") },
      ];

  const locText = state.userLoc
    ? `${state.userLoc.lat.toFixed(2)}°, ${state.userLoc.lng.toFixed(2)}°`
    : "Location off";

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={pdLogo} alt="PD — Healthcare at your doorstep" className="h-7 w-auto select-none" />
          </div>
          <div className="text-xs text-slate-700 flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {locText}
            </span>
            <span className="inline-flex items-center gap-1">
              <Timer className="h-4 w-4" />
              {dynamicEta != null ? `${dynamicEta} mins` : "—"}
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl pb-32 p-3 sm:p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.screen}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {Screens[state.screen]}
          </motion.div>
        </AnimatePresence>
      </main>

      {showBottomNav && (
        <nav
          role="navigation"
          className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md bg-white/95 border border-slate-200 shadow-xl backdrop-blur rounded-3xl"
        >
          <div className="grid" style={{ gridTemplateColumns: `repeat(${bottomTabs.length}, minmax(0, 1fr))` }}>
            {bottomTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={tab.onClick}
                className={`py-3 flex flex-col items-center justify-center text-xs ${state.screen === tab.key ? "text-sky-600" : "text-slate-700"}`}
              >
                {tab.icon}
                <span className="mt-1">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      <div className="fixed bottom-24 inset-x-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col gap-2 w-full max-w-sm px-4">
          {state.toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-xl shadow-lg px-4 py-3 text-sm flex items-center gap-2 ${
                t.type === "success"
                  ? "bg-emerald-600 text-white"
                  : t.type === "error"
                  ? "bg-rose-600 text-white"
                  : "bg-slate-800 text-white"
              }`}
            >
              {t.type === "success" && <CheckCircle className="h-4 w-4" />}
              {t.type === "error" && <AlertTriangle className="h-4 w-4" />}
              <span>{t.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
