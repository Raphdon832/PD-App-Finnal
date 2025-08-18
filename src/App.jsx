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

/* seed vendor coords (rough Abuja areas) */
const seedVendors = baseSeedVendors.map((v) => {
  if (v.name.includes("ZenCare")) return { ...v, lat: 8.854, lng: 7.227 };
  if (v.name.includes("GreenLeaf")) return { ...v, lat: 9.03, lng: 7.488 };
  return v;
});

/* small cache for reverse geocoding */
const geoCacheKey = (lat, lng) =>
  `PD_GEOCACHE_${lat.toFixed(3)}_${lng.toFixed(3)}`;

async function reverseGeocode(lat, lng) {
  try {
    const key = geoCacheKey(lat, lng);
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached);

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=14&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "PD-Prototype/1.0 (demo)",
        Referer: window.location.origin,
      },
    });
    if (!res.ok) throw new Error("geocode failed");
    const data = await res.json();
    const a = data.address || {};
    const locality =
      a.city || a.town || a.village || a.suburb || a.residential || a.county;
    const region = a.state || a.region;
    const country = a.country_code ? a.country_code.toUpperCase() : a.country;
    const label =
      [locality, region].filter(Boolean).join(", ") ||
      data.display_name?.split(",").slice(0, 2).join(", ");
    const result = {
      label: label || `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
      short: locality || label || "",
      region: region || "",
      country: "",
    };
    localStorage.setItem(key, JSON.stringify(result));
    return result;
  } catch {
    return {
      label: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
      short: "",
      region: "",
      country: "",
    };
  }
}

/* ------------------- identity + safety helpers ------------------- */
const asArray = (v) => (Array.isArray(v) ? v : []);

const getVendorForPharm = (me, vendors) =>
  me?.role === "pharmacist"
    ? vendors.find((v) => v.name === me.pharmacyName) || null
    : null;

const getCustomerId = (me) => me?.uid || me?.id || null;
const getVendorId = (me, vendors) => getVendorForPharm(me, vendors)?.id || null;

const seenKeyFor = (me, vendors) => {
  if (!me) return null;
  if (me.role === "pharmacist")
    return `PD_LAST_MSG_SEEN_PHARM_${getVendorId(me, vendors) || "unknown"}`;
  return `PD_LAST_MSG_SEEN_CUST_${getCustomerId(me) || "unknown"}`;
};
/* --------------------------------------------------------------- */

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

      // unified messaging per (vendorId, customerId)
      // { id, vendorId, customerId, customerName?, lastAt, messages: [{id, from:'customer'|'vendor', text, at}] }
      conversations: [],

      lastMessagesSeenAt: 0,
      toasts: [],
      userLoc: null,
      userPlace: null,
    })
  );

  /* migration: ensure conversations array exists */
  React.useEffect(() => {
    setState((s) => (Array.isArray(s.conversations) ? s : { ...s, conversations: [] }));
  }, []);

  /* persist */
  React.useEffect(() => saveToLS("PD_STATE", state), [state]);

  /* geolocation */
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

  /* reverse geocode */
  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!state.userLoc) return;
      const place = await reverseGeocode(state.userLoc.lat, state.userLoc.lng);
      if (!cancelled) setState((s) => ({ ...s, userPlace: place }));
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [state.userLoc]);

  const me = state.me;
  const myVendor = React.useMemo(() => getVendorForPharm(me, state.vendors), [me, state.vendors]);

  /* ensure customers have stable uid */
  React.useEffect(() => {
    if (!me) return;
    if (me.role === "customer" && !me.uid) {
      setState((s) => ({ ...s, me: { ...s.me, uid: s.me.id || uid() } }));
    }
  }, [me]);

  /* load per-account last seen timestamp */
  React.useEffect(() => {
    const key = seenKeyFor(me, state.vendors);
    if (!key) return;
    const v = Number(localStorage.getItem(key) || 0);
    setState((s) => ({ ...s, lastMessagesSeenAt: v }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.role, myVendor?.id]);

  const _setLastMessagesSeenNow = React.useCallback(() => {
    const key = seenKeyFor(me, state.vendors);
    if (!key) return;
    const now = Date.now();
    localStorage.setItem(key, String(now));
    setState((s) => ({ ...s, lastMessagesSeenAt: now }));
  }, [me, state.vendors]);

  const go = (screen, screenParams = {}) => {
    if (screen === "messages") _setLastMessagesSeenNow();
    setState((s) => ({ ...s, screen, screenParams }));
  };

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

  const targetVendor = React.useMemo(() => {
    if (state.screen === "vendorProfile" && state.screenParams.id) {
      return vendorById(state.screenParams.id);
    }
    if (state.screen === "product" && state.screenParams.id) {
      const p = productById(state.screenParams.id);
      if (p) return vendorById(p.vendorId);
    }
    if (!state.userLoc) return null;
    let best = null,
      bestD = Infinity;
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
    return haversineKm(state.userLoc, { lat: targetVendor.lat, lng: targetVendor.lng });
  }, [state.userLoc, targetVendor]);

  const dynamicEta = etaMinutes(distanceKm);
  const etaLabel =
    dynamicEta != null ? `${dynamicEta} mins${targetVendor?.name ? ` to ${targetVendor.name}` : ""}` : "—";

  const addToCart = (productId) =>
    setState((s) => {
      const p = s.products.find((p) => p.id === productId);
      if (!p) return s;
      const existing = s.cart.find((ci) => ci.productId === productId);
      let cart;
      if (existing)
        cart = s.cart.map((ci) =>
          ci.productId === productId ? { ...ci, qty: Math.min(ci.qty + 1, p.stock) } : ci
        );
      else cart = [...s.cart, { id: uid(), productId, vendorId: p.vendorId, qty: 1 }];
      return { ...s, cart };
    });

  const setQty = (lineId, qty) =>
    setState((s) => ({
      ...s,
      cart: s.cart.map((ci) => (ci.id === lineId ? { ...ci, qty: Math.max(1, qty) } : ci)),
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
      const vendors = exists ? s.vendors.map((x) => (x.id === v.id ? v : x)) : [...s.vendors, v];
      return { ...s, vendors };
    });

  const addProduct = (p) =>
    setState((s) => ({ ...s, products: [{ ...p, id: uid() }, ...s.products] }));
  const removeProduct = (pid) =>
    setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== pid) }));

  /* -------------------------- Messaging (unique + names) -------------------------- */
  const getOrCreateConversation = React.useCallback(
    (vendorId, customerId, customerName) => {
      if (!vendorId || !customerId) return null;
      const list = asArray(state.conversations);
      let conv = list.find((c) => c.vendorId === vendorId && c.customerId === customerId);
      if (!conv) {
        conv = {
          id: uid(),
          vendorId,
          customerId,
          customerName: customerName || undefined, // store if we know it
          lastAt: Date.now(),
          messages: [],
        };
        setState((s) => ({ ...s, conversations: [conv, ...asArray(s.conversations)] }));
      } else if (customerName && !conv.customerName) {
        // backfill name later if it was missing
        const next = list.map((c) =>
          c === conv ? { ...c, customerName } : c
        );
        setState((s) => ({ ...s, conversations: next }));
      }
      return conv;
    },
    [state.conversations]
  );

  const sendConversationMessage = React.useCallback(
    (vendorId, customerId, text, fromRole, customerNameOpt) => {
      if (!vendorId || !customerId || !text?.trim()) return;
      setState((s) => {
        const list = asArray(s.conversations);
        const idx = list.findIndex((c) => c.vendorId === vendorId && c.customerId === customerId);
        const nowIso = new Date().toISOString();
        const newMsg = { id: uid(), from: fromRole, text, at: nowIso };

        if (idx === -1) {
          const conv = {
            id: uid(),
            vendorId,
            customerId,
            customerName: customerNameOpt || undefined,
            lastAt: Date.now(),
            messages: [newMsg],
          };
          return { ...s, conversations: [conv, ...list] };
        } else {
          const conv = list[idx];
          const updated = {
            ...conv,
            // if we learn the customer's name later, keep it
            customerName: conv.customerName || customerNameOpt || undefined,
            lastAt: Date.now(),
            messages: [...asArray(conv.messages), newMsg],
          };
          const next = [...list];
          next[idx] = updated;
          return { ...s, conversations: next };
        }
      });
    },
    []
  );

  // customer starts/continues chat from product/vendor
  const startChatWithVendor = (vendorId, initialText) => {
    const customerId = getCustomerId(me);
    if (!customerId) return;
    const custName = me?.name || me?.fullName || me?.displayName || me?.email || `Customer U_${String(customerId).slice(0, 4).toUpperCase()}`;
    if (initialText) {
      sendConversationMessage(vendorId, customerId, initialText, "customer", custName);
    } else {
      getOrCreateConversation(vendorId, customerId, custName);
    }
    go("messages");
  };

  // send handler for Messages page
  const onSendFromMessages = (partnerId, text) => {
    if (!me) return;
    if (me.role === "customer") {
      const customerId = getCustomerId(me);
      const custName = me?.name || me?.fullName || me?.displayName || me?.email || `Customer U_${String(customerId).slice(0, 4).toUpperCase()}`;
      sendConversationMessage(partnerId, customerId, text, "customer", custName);
    } else if (me.role === "pharmacist" && myVendor?.id) {
      // pharmacist does not know customer's name here—it's already stored from customer's messages
      sendConversationMessage(myVendor.id, partnerId, text, "vendor");
    }
  };

  /* --------------------- counts + derived inbox threads --------------------- */
  const cartCount = state.cart.reduce((sum, ci) => sum + ci.qty, 0);
  const conversationsSafe = asArray(state.conversations);

  const unreadMessages = React.useMemo(() => {
    const since = Number(state.lastMessagesSeenAt) || 0;
    let total = 0;
    for (const c of conversationsSafe) {
      if (me?.role === "customer") {
        if (c.customerId !== getCustomerId(me)) continue;
      } else if (me?.role === "pharmacist") {
        if (c.vendorId !== getVendorId(me, state.vendors)) continue;
      } else continue;

      for (const m of asArray(c.messages)) {
        const t = new Date(m.at || 0).getTime();
        if (t > since) {
          if (me?.role === "customer" && m.from === "vendor") total += 1;
          if (me?.role === "pharmacist" && m.from === "customer") total += 1;
        }
      }
    }
    return total;
  }, [conversationsSafe, state.lastMessagesSeenAt, me, state.vendors]);

  // Build legacy-compatible threads AND a pharmacist-only name map via augmented vendors
  const inboxThreads = React.useMemo(() => {
    const map = {};
    for (const c of conversationsSafe) {
      if (me?.role === "customer") {
        if (c.customerId !== getCustomerId(me)) continue;
        const key = c.vendorId; // partner is vendor
        const arr = map[key] || [];
        for (const m of asArray(c.messages)) {
          arr.push({ id: m.id, from: m.from === "customer" ? "me" : "them", text: m.text, at: m.at });
        }
        map[key] = arr;
      } else if (me?.role === "pharmacist" && myVendor?.id) {
        if (c.vendorId !== myVendor.id) continue;
        const key = c.customerId; // partner is customer
        const arr = map[key] || [];
        for (const m of asArray(c.messages)) {
          arr.push({ id: m.id, from: m.from === "vendor" ? "me" : "them", text: m.text, at: m.at });
        }
        map[key] = arr;
      }
    }
    return map;
  }, [conversationsSafe, me, myVendor?.id]);

  // For pharmacist view: augment vendors with "virtual vendors" = customers (id=name: customerId, name=customerName)
  const vendorsForMessages = React.useMemo(() => {
    if (me?.role !== "pharmacist" || !myVendor?.id) return state.vendors;

    const labelFor = (c) =>
      c.customerName ||
      `Customer U_${String(c.customerId).slice(0, 4).toUpperCase()}`;

    const map = {};
    for (const c of conversationsSafe) {
      if (c.vendorId !== myVendor.id) continue;
      map[c.customerId] = { id: c.customerId, name: labelFor(c) };
    }
    const virtuals = Object.values(map);
    return [...state.vendors, ...virtuals];
  }, [me, myVendor?.id, conversationsSafe, state.vendors]);

  /* -------------------------------- Screens -------------------------------- */
  const Screens = {
    landing: <Landing onSelectRole={(role) => go("auth", { role })} />,

    auth: (
      <AuthFlow
        role={state.screenParams.role}
        onBack={() => go("landing")}
        onDone={(user) => {
          const withUid = user.role === "customer" ? { ...user, uid: user.uid || user.id || uid() } : user;
          setState((s) => ({
            ...s,
            me: withUid,
            screen: withUid.role === "customer" ? "home" : "vendorDashboard",
          }));
        }}
      />
    ),

    home: (
      <Home
        go={go}
        vendors={state.vendors}
        products={state.products}
        userLoc={state.userLoc}
        addToCart={(id) => addToCart(id)}
      />
    ),
    catalog: (
      <Catalog
        go={go}
        vendors={state.vendors}
        products={state.products}
        userLoc={state.userLoc}
        addToCart={(id) => addToCart(id)}
        initialCategory={state.screenParams.category}
      />
    ),
    product: (
      <ProductDetail
        product={productById(state.screenParams.id)}
        vendor={vendorById(productById(state.screenParams.id)?.vendorId)}
        onVendor={(id) => go("vendorProfile", { id })}
        onAdd={() => addToCart(state.screenParams.id)}
        onEnquiry={(vendorId, text) => startChatWithVendor(vendorId, text)}
      />
    ),
    cart: (
      <Cart
        cart={state.cart}
        productById={productById}
        setQty={setQty}
        removeLine={removeLine}
        total={state.cart.reduce((sum, ci) => {
          const p = productById(ci.productId);
          return sum + (p ? p.price * ci.qty : 0);
        }, 0)}
        onCheckout={() => checkout()}
      />
    ),
    checkout: (
      <Checkout
        total={state.cart.reduce((sum, ci) => {
          const p = productById(ci.productId);
          return sum + (p ? p.price * ci.qty : 0);
        }, 0)}
        onPlace={checkout}
        onCancel={() => go("cart")}
      />
    ),
    orders: <Orders orders={state.orders} productById={productById} />,

    messages:
      Object.keys(inboxThreads).length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-500">No Chats</div>
      ) : (
        <Messages
          // KEY PART: pharmacist sees customers' display names via augmented vendors list
          vendors={vendorsForMessages}
          threads={inboxThreads || {}}
          // For pharmacist view, don’t show "View store" on customer profiles
          onOpenVendor={me?.role === "pharmacist" ? undefined : (id) => go("vendorProfile", { id })}
          onSend={(partnerId, text) => onSendFromMessages(partnerId, text)}
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
        onMessage={(vendorId, text) => startChatWithVendor(vendorId, text)}
        onAddToCart={(id) => addToCart(id)}
      />
    ),
    profile: <Profile me={me} onLogout={() => setState((s) => ({ ...s, me: null, screen: "landing" }))} />,
  };

  const showBottomNav = state.screen !== "landing" && state.screen !== "auth";

  const bottomTabs =
    me?.role === "pharmacist"
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

  const locText =
    state.userPlace?.label ||
    (state.userLoc ? `${state.userLoc.lat.toFixed(2)}°, ${state.userLoc.lng.toFixed(2)}°` : "Location off");

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
              {dynamicEta != null && targetVendor?.name ? `${dynamicEta} mins to ${targetVendor.name}` : etaLabel}
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
            {bottomTabs.map((tab) => {
              const isActive = state.screen === tab.key;
              const showCartBadge = tab.key === "cart" && cartCount > 0;
              const cartBadgeText = cartCount > 99 ? "99+" : String(cartCount);
              const showMsgBadge = tab.key === "messages" && unreadMessages > 0;
              const msgBadgeText = unreadMessages > 99 ? "99+" : String(unreadMessages);

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={tab.onClick}
                  className={`py-3 flex flex-col items-center justify-center text-xs ${isActive ? "text-sky-600" : "text-slate-700"}`}
                >
                  <div className="relative">
                    {tab.icon}
                    {showCartBadge && (
                      <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] leading-[18px] text-center font-semibold shadow-sm">
                        {cartBadgeText}
                      </span>
                    )}
                    {showMsgBadge && (
                      <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] leading-[18px] text-center font-semibold shadow-sm">
                        {msgBadgeText}
                      </span>
                    )}
                  </div>
                  <span className="mt-1">{tab.label}</span>
                </button>
              );
            })}
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
