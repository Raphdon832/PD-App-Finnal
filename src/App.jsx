// src/App.jsx
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Timer, CheckCircle, AlertTriangle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { loadFromLS, saveToLS, uid } from "@/lib/utils";
import { seedVendors as baseSeedVendors, seedProducts } from "@/lib/data";
import pdLogo from "@/assets/pd-logo.png";

/* ---- Custom SVGs as RAW strings (no SVGR required) ---- */
import HomeSvgRaw from "@/assets/icons/home.svg?raw";
import OrdersSvgRaw from "@/assets/icons/orders.svg?raw";
import MessagesSvgRaw from "@/assets/icons/messages.svg?raw";
import CartSvgRaw from "@/assets/icons/cart.svg?raw";
import ProfileSvgRaw from "@/assets/icons/profile.svg?raw";
import DashboardSvgRaw from "@/assets/icons/dashboard.svg?raw";

/* ==================== sanitize Figma colors -> currentColor ==================== */
const sanitizeSvgColors = (raw) => {
  let s = raw;
  s = s
    .replace(/fill="(?!none)[^"]*"/gi, 'fill="currentColor"')
    .replace(/stroke="[^"]*"/gi, 'stroke="currentColor"')
    .replace(/style="[^"]*"/gi, (m) =>
      m
        .replace(/fill:\s*(#[0-9a-f]{3,8}|rgb\([^)]+\))/gi, "fill:currentColor")
        .replace(/stroke:\s*(#[0-9a-f]{3,8}|rgb\([^)]+\))/gi, "stroke:currentColor")
    );
  if (!/viewBox=/.test(s)) s = s.replace("<svg", '<svg viewBox="0 0 24 24"');
  s = s.replace("<svg", '<svg style="width:100%;height:100%;display:block"');
  return s;
};
const makeSvgIcon = (raw) => {
  const fixed = sanitizeSvgColors(raw);
  return function SvgIcon({ className = "h-5 w-5", ...rest }) {
    return (
      <span
        className={className}
        style={{ display: "inline-block", lineHeight: 0 }}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: fixed }}
        {...rest}
      />
    );
  };
};
const HomeNavIcon = makeSvgIcon(HomeSvgRaw);
const OrdersNavIcon = makeSvgIcon(OrdersSvgRaw);
const MessagesNavIcon = makeSvgIcon(MessagesSvgRaw);
const CartNavIcon = makeSvgIcon(CartSvgRaw);
const ProfileNavIcon = makeSvgIcon(ProfileSvgRaw);
const DashboardNavIcon = makeSvgIcon(DashboardSvgRaw);

const NAV_ICONS = {
  home: HomeNavIcon,
  orders: OrdersNavIcon,
  messages: MessagesNavIcon,
  cart: CartNavIcon,
  profile: ProfileNavIcon,
  vendorDashboard: DashboardNavIcon,
};

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
async function reverseGeocode(lat, lng) {
  try {
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
    const label =
      [locality, region].filter(Boolean).join(", ") ||
      data.display_name?.split(",").slice(0, 2).join(", ");
    return {
      label: label || `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
      short: locality || label || "",
      region: region || "",
      country: "",
    };
  } catch {
    return {
      label: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
      short: "",
      region: "",
      country: "",
    };
  }
}

/* ------------------- identity + helpers ------------------- */
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
const normalizePhone = (s) => String(s || "").replace(/[^\d+]/g, "");

/* Prevent iOS zoom on inputs */
function useDisableIOSZoom() {
  useEffect(() => {
    const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
    if (!isIOS) return;
    const stopGesture = (e) => e.preventDefault();
    document.addEventListener("gesturestart", stopGesture, { passive: false });
    document.addEventListener("gesturechange", stopGesture, { passive: false });
    document.addEventListener("gestureend", stopGesture, { passive: false });
    let lastTouchEnd = 0;
    const onTouchEnd = (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    };
    document.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", stopGesture);
      document.removeEventListener("gesturechange", stopGesture);
      document.removeEventListener("gestureend", stopGesture);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, []);
}

export default function App() {
  useDisableIOSZoom();
  const [state, setState] = React.useState(() =>
    loadFromLS("PD_STATE", {
      screen: "landing",
      screenParams: {},
      me: null,
      vendors: seedVendors,
      products: seedProducts,
      cart: [],
      orders: [],
      conversations: [],
      lastMessagesSeenAt: 0,
      toasts: [],
      userLoc: null,
      userPlace: null,
    })
  );

  const [hideNavForChatThread, setHideNavForChatThread] = React.useState(false);

  useEffect(() => {
    setState((s) =>
      Array.isArray(s.conversations) ? s : { ...s, conversations: [] }
    );
  }, []);

  useEffect(() => saveToLS("PD_STATE", state), [state]);

  useEffect(() => {
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

  useEffect(() => {
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
  const myVendor = React.useMemo(
    () => getVendorForPharm(me, state.vendors),
    [me, state.vendors]
  );

  useEffect(() => {
    if (!me) return;
    if (me.role === "customer" && !me.uid) {
      setState((s) => ({ ...s, me: { ...s.me, uid: s.me.id || uid() } }));
    }
  }, [me]);

  useEffect(() => {
    const key = seenKeyFor(me, state.vendors);
    if (!key) return;
    const v = Number(localStorage.getItem(key) || 0);
    setState((s) => ({ ...s, lastMessagesSeenAt: v }));
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
    if (screen !== "messages") setHideNavForChatThread(false);
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
    let best = null, bestD = Infinity;
    for (const v of state.vendors) {
      if (typeof v.lat !== "number" || typeof v.lng !== "number") continue;
      const d = haversineKm(state.userLoc, { lat: v.lat, lng: v.lng });
      if (d != null && d < bestD) {
        best = v; bestD = d;
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
    dynamicEta != null
      ? `${dynamicEta} mins${targetVendor?.name ? ` to ${targetVendor.name}` : ""}`
      : "—";

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
      else
        cart = [...s.cart, { id: uid(), productId, vendorId: p.vendorId, qty: 1 }];
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

  const addProduct = (p) => setState((s) => ({ ...s, products: [{ ...p, id: uid() }, ...s.products] }));
  const removeProduct = (pid) =>
    setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== pid) }));

  /* -------------------------- Messaging -------------------------- */
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
          customerName: customerName || undefined,
          lastAt: Date.now(),
          messages: [],
        };
        setState((s) => ({ ...s, conversations: [conv, ...asArray(s.conversations)] }));
      } else if (customerName && !conv.customerName) {
        const next = list.map((c) => (c === conv ? { ...c, customerName } : c));
        setState((s) => ({ ...s, conversations: next }));
      }
      return conv;
    },
    [state.conversations]
  );

  // Accepts { text, attachments, replyTo }
  const sendConversationMessage = React.useCallback(
    (vendorId, customerId, payload, fromRole, customerNameOpt) => {
      const text = payload?.text || "";
      const attachments = Array.isArray(payload?.attachments) ? payload.attachments : [];
      const replyTo = payload?.replyTo || null;
      if (!vendorId || !customerId) return;
      if (!text.trim() && attachments.length === 0) return;

      setState((s) => {
        const list = asArray(s.conversations);
        const idx = list.findIndex((c) => c.vendorId === vendorId && c.customerId === customerId);
        const nowIso = new Date().toISOString();
        const newMsg = { id: uid(), from: fromRole, text: text.trim(), at: nowIso, attachments, replyTo };

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

  const startChatWithVendor = (vendorId, initialText) => {
    const customerId = getCustomerId(me);
    if (!customerId) return;
    const custName =
      me?.name || me?.fullName || me?.displayName || me?.email || `Customer U_${String(customerId).slice(0, 4).toUpperCase()}`;
    if (initialText) {
      sendConversationMessage(vendorId, customerId, { text: initialText }, "customer", custName);
    } else {
      getOrCreateConversation(vendorId, customerId, custName);
    }
    go("messages");
  };

  // onSend now forwards text + attachments + replyTo
  const onSendFromMessages = (partnerId, text, attachments, replyTo) => {
    if (!me) return;
    if (me.role === "customer") {
      const customerId = getCustomerId(me);
      const custName =
        me?.name || me?.fullName || me?.displayName || me?.email || `Customer U_${String(customerId).slice(0, 4).toUpperCase()}`;
      sendConversationMessage(partnerId, customerId, { text, attachments, replyTo }, "customer", custName);
    } else if (me.role === "pharmacist" && myVendor?.id) {
      sendConversationMessage(myVendor.id, partnerId, { text, attachments, replyTo }, "vendor");
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

  // Include replyTo + attachments in UI threads
  const inboxThreads = React.useMemo(() => {
    const map = {};
    for (const c of conversationsSafe) {
      if (me?.role === "customer") {
        if (c.customerId !== getCustomerId(me)) continue;
        const key = c.vendorId;
        const arr = map[key] || [];
        for (const m of asArray(c.messages))
          arr.push({
            id: m.id,
            from: m.from === "customer" ? "me" : "them",
            text: m.text,
            at: m.at,
            attachments: m.attachments || [],
            replyTo: m.replyTo || null,
          });
        map[key] = arr;
      } else if (me?.role === "pharmacist" && myVendor?.id) {
        if (c.vendorId !== myVendor.id) continue;
        const key = c.customerId;
        const arr = map[key] || [];
        for (const m of asArray(c.messages))
          arr.push({
            id: m.id,
            from: m.from === "vendor" ? "me" : "them",
            text: m.text,
            at: m.at,
            attachments: m.attachments || [],
            replyTo: m.replyTo || null,
          });
        map[key] = arr;
      }
    }
    return map;
  }, [conversationsSafe, me, myVendor?.id]);

  const vendorsForMessages = React.useMemo(() => {
    if (me?.role !== "pharmacist" || !myVendor?.id) return state.vendors;
    const labelFor = (c) => c.customerName || `Customer U_${String(c.customerId).slice(0, 4).toUpperCase()}`;
    const map = {};
    for (const c of conversationsSafe) {
      if (c.vendorId !== myVendor.id) continue;
      map[c.customerId] = { id: c.customerId, name: labelFor(c) };
    }
    return [...state.vendors, ...Object.values(map)];
  }, [me, myVendor?.id, conversationsSafe, state.vendors]);

  /* -------------------------------- Screens -------------------------------- */
  const Screens = {
    landing: <Landing onSelectRole={(role) => go("auth", { role })} />,
    auth: (
      <AuthFlow
        role={state.screenParams.role}
        onBack={() => go("landing")}
        onDone={(user) => {
          const withUid =
            user.role === "customer" ? { ...user, uid: user.uid || user.id || uid() } : user;
          setState((s) => ({ ...s, me: withUid, screen: withUid.role === "customer" ? "home" : "vendorDashboard" }));
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
    product: (() => {
      const product = productById(state.screenParams.id);
      const vendor = vendorById(product?.vendorId);
      const phone = vendor?.contact ? normalizePhone(vendor.contact) : "";

      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 justify-end">
            {phone && (
              <Button as="a" href={`tel:${phone}`} className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Call to order
              </Button>
            )}
          </div>

          <ProductDetail
            product={product}
            vendor={vendor}
            onVendor={(id) => go("vendorProfile", { id })}
            onAdd={() => addToCart(state.screenParams.id)}
            onEnquiry={(vendorId, text) => startChatWithVendor(vendorId, text)}
          />
        </div>
      );
    })(),
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
          vendors={vendorsForMessages}
          threads={inboxThreads || {}}
          onOpenVendor={me?.role === "pharmacist" ? undefined : (id) => go("vendorProfile", { id })}
          onSend={(partnerId, text, attachments, replyTo) => onSendFromMessages(partnerId, text, attachments, replyTo)}
          resolvePhone={(partnerId) => {
            const v = vendorById(partnerId);
            return v?.contact ? normalizePhone(v.contact) : "";
          }}
          onActiveThreadChange={(active) => setHideNavForChatThread(Boolean(active))}
          lastSeenAt={state.lastMessagesSeenAt}
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

  const showHeader = !(state.screen === "messages" && hideNavForChatThread);
  const showBottomNav =
    state.screen !== "landing" &&
    state.screen !== "auth" &&
    !(state.screen === "messages" && hideNavForChatThread);

  const mainPad = state.screen === "messages" && hideNavForChatThread ? "p-0" : "p-3 sm:p-4";
  const mainPb =
    state.screen === "messages" && hideNavForChatThread ? "pb-0" : showBottomNav ? "pb-32" : "pb-4";
  const mainOverflow = state.screen === "messages" && hideNavForChatThread ? "overflow-hidden" : "";

  const bottomTabs =
    me?.role === "pharmacist"
      ? [
          { key: "vendorDashboard", label: "Dashboard", onClick: () => go("vendorDashboard") },
          { key: "orders", label: "Orders", onClick: () => go("orders") },
          { key: "messages", label: "Messages", onClick: () => go("messages") },
          { key: "profile", label: "Profile", onClick: () => go("profile") },
        ]
      : [
          { key: "home", label: "Home", onClick: () => go("home") },
          { key: "orders", label: "Orders", onClick: () => go("orders") },
          { key: "messages", label: "Messages", onClick: () => go("messages") },
          { key: "cart", label: "Cart", onClick: () => go("cart") },
          { key: "profile", label: "Profile", onClick: () => go("profile") },
        ];

  const locText =
    state.userPlace?.label ||
    (state.userLoc ? `${state.userLoc.lat.toFixed(2)}°, ${state.userLoc.lng.toFixed(2)}°` : "Location off");

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {showHeader && (
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
      )}

      <main className={`mx-auto max-w-5xl ${mainPad} ${mainPb} ${mainOverflow}`}>
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
          className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md bg-white/50 border-[2px] border-slate-200 shadow-xl backdrop-blur-[5px] rounded-[10px]"
        >
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${bottomTabs.length}, minmax(0, 1fr))` }}
          >
            {bottomTabs.map((tab) => {
              const isActive = state.screen === tab.key;
              const cartCount = state.cart.reduce((sum, ci) => sum + ci.qty, 0);
              const showCartBadge = tab.key === "cart" && cartCount > 0;
              const cartBadgeText = cartCount > 99 ? "99+" : String(cartCount);

              // recompute unread (already memoized above)
              const unread =
                tab.key === "messages"
                  ? (state.conversations || []).reduce((total, c) => {
                      const since = Number(state.lastMessagesSeenAt) || 0;
                      for (const m of asArray(c.messages)) {
                        const t = new Date(m.at || 0).getTime();
                        if (t > since) {
                          if (me?.role === "customer" && m.from === "vendor") total += 1;
                          if (me?.role === "pharmacist" && m.from === "customer") total += 1;
                        }
                      }
                      return total;
                    }, 0)
                  : 0;

              const showMsgBadge = tab.key === "messages" && unread > 0;
              const msgBadgeText = unread > 99 ? "99+" : String(unread);

              const IconCmp = NAV_ICONS[tab.key] || NAV_ICONS.messages;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={tab.onClick}
                  className={`py-3 flex flex-col items-center justify-center text-xs ${isActive ? "text-sky-600" : "text-slate-700"}`}
                >
                  <div className="relative">
                    <IconCmp className="h-5 w-5" />
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

      {/* Toasts */}
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
