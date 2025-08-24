// src/App.jsx
import React, { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Timer, CheckCircle, AlertTriangle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { loadFromLS, saveToLS, uid } from "@/lib/utils";
import { seedVendors as baseSeedVendors, seedProducts } from "@/lib/data";
import pdLogo from "@/assets/pd-logo.png";
import { listenToProducts, addProduct as addProductToFirestore, updateProduct, deleteProduct } from "@/lib/firebase-products";
import { signUpWithEmail, signInWithEmailAndEnsureProfile } from "@/lib/auth-firebase";
import { listenToOrders } from "@/lib/firebase-orders";
import { listenToProfiles } from "@/lib/firebase-profiles";

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

/* ===== Stable ID helpers (declared early to avoid TDZ) ===== */
const getVendorById = (vendors, id) => (vendors || []).find(v => v?.id === id) || null;

const normalizeVendorId = (vendors, anyId) => {
  const v = getVendorById(vendors, anyId);
  return (v && v.uid) ? v.uid : String(anyId ?? "");
};

const getVendorForPharm = (me, vendors) =>
  me?.role === "pharmacist"
    ? (vendors || []).find(v => (v?.uid || v?.id) === (me?.uid || me?.id)) || null
    : null;

const getVendorForPharm2 = getVendorForPharm; // back-compat
const getVendorId = (me, vendors) => {
  if (me?.role === "pharmacist") {
    // Find vendor by pharmacist's id or pharmacyName
    let v = null;
    if (me.pharmacyName) {
      v = (vendors || []).find(x => x.name === me.pharmacyName || x.id === me.id);
    } else {
      v = (vendors || []).find(x => x.id === me.id);
    }
    return v?.id || null;
  }
  return null;
};
const getCustomerId = (me) => me?.id || null;


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

/* reverse geocoding (OpenStreetMap) */
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
// (Do NOT redeclare getVendorForPharm here; it’s defined above)
//const getCustomerId = (me) => me?.uid || me?.id || null;
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
      products: [], // Start with empty, will be filled by Firestore
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

  // Ensure conversations is always an array
  useEffect(() => {
    setState((s) =>
      Array.isArray(s.conversations) ? s : { ...s, conversations: [] }
    );
  }, []);

  useEffect(() => saveToLS("PD_STATE", state), [state]);

  // Geolocation
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

  // Reverse geocode
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
    () => getVendorById(state.vendors, getVendorId(me, state.vendors)),
    [me, state.vendors]
  );

  // Ensure customers have a uid
  useEffect(() => {
    if (!me) return;
    if (me.role === "customer" && !me.uid) {
      setState((s) => ({ ...s, me: { ...s.me, uid: s.me.id || uid() } }));
    }
  }, [me]);

  // Ensure pharmacist's me.uid always matches vendor's UID
  useEffect(() => {
    if (!me || me.role !== "pharmacist") return;
    // Find vendor by pharmacyName, id, or uid
    let v = null;
    if (me.pharmacyName) {
      v = state.vendors.find(
        (x) => x.name === me.pharmacyName || x.id === me.id
      );
    } else {
      v = state.vendors.find((x) => x.id === me.id);
    }
    if (v && me.uid !== v.uid) {
      setState((s) => ({ ...s, me: { ...s.me, uid: v.uid } }));
    }
  }, [me, state.vendors]);

  // Load last seen messages timestamp for the current identity
  useEffect(() => {
    const key = seenKeyFor(me, state.vendors);
    if (!key) return;
    const v = Number(localStorage.getItem(key) || 0);
    setState((s) => ({ ...s, lastMessagesSeenAt: v }));
  }, [me?.role, myVendor?.uid]);

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

  // --- Real-time Firestore products sync ---
  useEffect(() => {
    const unsub = listenToProducts((products) => {
      setState((s) => ({ ...s, products }));
    });
    return () => unsub && unsub();
  }, []);

  // --- Real-time Firestore orders sync ---
  useEffect(() => {
    const unsub = listenToOrders((orders) => {
      setState((s) => ({ ...s, orders }));
    });
    return () => unsub && unsub();
  }, []);

  // --- Real-time Firestore profiles sync (vendors) ---
  useEffect(() => {
    const unsub = listenToProfiles((profiles) => {
      setState((s) => ({ ...s, vendors: profiles }));
    });
    return () => unsub && unsub();
  }, []);

  // Add product: always add to Firestore
  const addProduct = async (p) => {
    await addProductToFirestore(p);
    // No local state update needed; Firestore listener will update products
  };

  // Remove product: always delete from Firestore
  const removeProduct = async (pid) => {
    await deleteProduct(pid);
    // No local state update needed; Firestore listener will update products
  };

  // ---- Data helpers
  const vendorById = useMemo(
    () => Object.fromEntries(state.vendors.map((v) => [v.uid || v.id, v])),
    [state.vendors]
  );
  const productById = (id) => state.products.find((p) => p.id === id);

  // Distance + ETA helpers for header
  const targetVendor = React.useMemo(() => {
    if (state.screen === "vendorProfile" && state.screenParams.id) {
      return vendorById[state.screenParams.id];
    }
    if (state.screen === "product" && state.screenParams.id) {
      const p = productById(state.screenParams.id);
      if (p) return vendorById[p.vendorId];
    }
    if (!state.userLoc) return null;
    let best = null,
      bestD = Infinity;
    for (const v of state.vendors) {
      if (typeof v.lat !== "number" || typeof v.lng !== "number") continue;
      const d = haversineKm(state.userLoc, { lat: v.lat, lng: v.lng });
      if (d < bestD) {
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
    dynamicEta != null
      ? `${dynamicEta} mins${targetVendor?.name ? ` to ${targetVendor.name}` : ""}`
      : "—";

  // Cart + checkout
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
      // keep me.pharmacyName in sync for pharmacists
      let me = s.me;
      if (me?.role === "pharmacist" && v.name && me.pharmacyName !== v.name) {
        me = { ...me, pharmacyName: v.name };
      }
      return { ...s, vendors, me };
    });

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
    const vId = vendorId;
    if (!vId || !me) return;

    if (me.role === "customer") {
      const customerId = getCustomerId(me);
      if (!customerId) return;
      const custName =
        me?.name || me?.fullName || me?.displayName || me?.email ||
        `Customer U_${String(customerId).slice(0, 4).toUpperCase()}`;

      // Ensure thread exists
      getOrCreateConversation(vId, customerId, custName);

      // Optional first message
      if (initialText && String(initialText).trim().length > 0) {
        sendConversationMessage(
          vId,
          customerId,
          { text: String(initialText).trim() },
          "customer",
          custName
        );
      }
      go("messages");
    } else if (me.role === "pharmacist" && myVendor) {
      go("messages");
    }
  };

  // onSend now forwards text + attachments + replyTo
  const onSendFromMessages = (partnerId, text, attachments, replyTo) => {
    if (!me) return;
    if (me.role === "customer") {
      const customerId = getCustomerId(me);
      const custName =
        me?.name || me?.fullName || me?.displayName || me?.email ||
        `Customer U_${String(customerId).slice(0, 4).toUpperCase()}`;
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

  // 1) Build inboxThreads FIRST
  const inboxThreads = React.useMemo(() => {
    const map = {};
    for (const c of conversationsSafe) {
      if (me?.role === "customer") {
        if (c.customerId !== getCustomerId(me)) continue;
        const key = c.vendorId;
        const arr = map[key] || [];
        for (const m of asArray(c.messages)) {
          arr.push({
            id: m.id,
            from: m.from === "customer" ? "me" : "them",
            text: m.text,
            at: m.at,
            attachments: m.attachments || [],
            replyTo: m.replyTo || null,
          });
        }
        map[key] = arr;
      } else if (me?.role === "pharmacist" && myVendor?.id) {
        if (c.vendorId !== myVendor.id) continue;
        const key = c.customerId;
        const arr = map[key] || [];
        for (const m of asArray(c.messages)) {
          arr.push({
            id: m.id,
            from: m.from === "vendor" ? "me" : "them",
            text: m.text,
            at: m.at,
            attachments: m.attachments || [],
            replyTo: m.replyTo || null,
          });
        }
        map[key] = arr;
      }
    }
    return map;
  }, [conversationsSafe, me, myVendor?.id]);

  // 2) Normalize thread keys to vendor UIDs for Messages
  const threadsForMessages = React.useMemo(() => inboxThreads, [inboxThreads]);

  // 3) Vendors list for Messages (pharmacist view appends customers)
  const vendorsForMessages = React.useMemo(() => {
    if (me?.role !== "pharmacist" || !myVendor?.id) return state.vendors;
    const labelFor = (c) =>
      c.customerName || `Customer U_${String(c.customerId).slice(0, 4).toUpperCase()}`;
    const map = {};
    for (const c of conversationsSafe) {
      if (c.vendorId !== myVendor.id) continue;
      map[c.customerId] = { id: c.customerId, name: labelFor(c) };
    }
    return [...state.vendors, ...Object.values(map)];
  }, [me, myVendor?.id, conversationsSafe, state.vendors]);

  // ---- Handlers expected by <Messages />
  const handleSendMessage = (...args) => onSendFromMessages(...args);

  const handleOpenVendor = (partnerId) => {
    const v = (state.vendors || []).find((x) => (x.uid || x.id) === partnerId);
    if (v) go("vendorProfile", { id: v.uid || v.id });
  };

  const resolvePhone = (partnerId) => {
    const v = (state.vendors || []).find((x) => (x.uid || x.id) === partnerId);
    return v?.contact ? normalizePhone(v.contact) : "";
  };

  const onActiveThreadChange = (active) => {
    setHideNavForChatThread(!!active);
  };

  /* -------------------------------- Screens -------------------------------- */
  const Screens = {
    landing: <Landing onSelectRole={(role) => go("auth", { role })} />,
    auth: (
      <AuthFlow
        role={state.screenParams.role}
        onBack={() => go("landing")}
        onDone={(user) => {
          let withUid = user;
          if (user.role === "customer") {
            withUid = { ...user, uid: user.uid || user.id || uid() };
          } else if (user.role === "pharmacist") {
            // Ensure pharmacist's me.uid matches their vendor UID if possible
            const vendor = (state.vendors || []).find(v => v.id === user.id || v.name === user.pharmacyName);
            withUid = { ...user, uid: vendor?.uid || user.uid || user.id || uid() };
          }
          // Set global role for chat UI logic (e.g., hiding View Store button)
          if (withUid.role) window.PD_APP_ROLE = withUid.role;
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
    product: (() => {
      const product = productById(state.screenParams.id);
      let vendor = vendorById[product?.vendorId];
      if (!vendor && product?.vendorId) {
        vendor = state.vendors.find((v) => v.id === product.vendorId);
      }
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
            onVendor={(id) => {
              // Find vendor by id or uid
              const v = vendorById[id] || state.vendors.find((vv) => vv.id === id);
              go("vendorProfile", { id: v ? (v.uid || v.id) : id });
            }}
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
      !inboxThreads || Object.keys(inboxThreads).length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-500">No Chats</div>
      ) : (
        <Messages
          vendors={vendorsForMessages}
          threads={threadsForMessages}
          onSend={handleSendMessage}
          onOpenVendor={handleOpenVendor}
          resolvePhone={resolvePhone}
          onActiveThreadChange={onActiveThreadChange}
          lastSeenAt={state.lastMessagesSeenAt}
          me={me}
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
        vendor={vendorById[state.screenParams.id] || state.vendors.find((v) => v.id === state.screenParams.id)}
        products={state.products.filter(
          (p) => p.vendorId === state.screenParams.id || vendorById[p.vendorId]?.id === state.screenParams.id
        )}
        onMessage={startChatWithVendor}
        onAddToCart={addToCart}
      />
    ),
    profile: (
      <Profile
        me={me}
        myVendor={myVendor}
        upsertVendor={upsertVendor}
        onLogout={() => setState((s) => ({ ...s, me: null, screen: "landing" }))}
      />
    ),
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

  const locText =
    state.userPlace?.label ||
    (state.userLoc ? `${state.userLoc.lat.toFixed(2)}°, ${state.userLoc.lng.toFixed(2)}°` : "Location off");

  useEffect(() => {
    const prevent = e => e.preventDefault();
    document.addEventListener('copy', prevent, true);
    document.addEventListener('cut', prevent, true);
    document.addEventListener('selectstart', prevent, true);
    return () => {
      document.removeEventListener('copy', prevent, true);
      document.removeEventListener('cut', prevent, true);
      document.removeEventListener('selectstart', prevent, true);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {showHeader && (
        <div className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between font-poppins leading-none text-[9px]">
            <div className="flex items-center gap-2">
              <img src={pdLogo} alt="PD — Healthcare at your doorstep" className="h-7 w-auto select-none" />
            </div>
            <div className="text-xs text-slate-700 flex items-center gap-3 font-poppins leading-none text-[9px]">
              <span className="inline-flex items-center gap-1 font-poppins leading-none text-[9px]">
                <MapPin className="h-3 w-3" />
                {locText}
              </span>
              <span className="inline-flex items-center gap-1 font-poppins leading-none text-[9px]">
                <Timer className="h-3 w-3" />
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
            style={{ gridTemplateColumns: `repeat(${(me?.role === "pharmacist" ? 4 : 5)}, minmax(0, 1fr))` }}
          >
            {(me?.role === "pharmacist"
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
                ]
            ).map((tab) => {
              const isActive = state.screen === tab.key;
              const cartCount = state.cart.reduce((sum, ci) => sum + ci.qty, 0);
              const showCartBadge = tab.key === "cart" && cartCount > 0;
              const cartBadgeText = cartCount > 99 ? "99+" : String(cartCount);

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
                  className={`py-3 flex flex-col items-center justify-center text-xs font-poppins tracking-tighter ${isActive ? "text-sky-600 font-bold" : "text-slate-700 font-normal"}`}
                >
                  <div className="relative">
                    <IconCmp className="h-5 w-5" />
                    {showCartBadge && (
                      <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] leading-[18px] text-center font-semibold shadow-sm font-poppins tracking-tighter">
                        {cartBadgeText}
                      </span>
                    )}
                    {showMsgBadge && (
                      <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] leading-[18px] text-center font-semibold shadow-sm font-poppins tracking-tighter">
                        {msgBadgeText}
                      </span>
                    )}
                  </div>
                  <span className={`mt-1 font-poppins tracking-tighter ${isActive ? "font-bold" : "font-normal"}`}>{tab.label}</span>
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
