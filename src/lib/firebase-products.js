// Firestore product helpers
import { db } from "./firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} 

from "firebase/firestore";
import { getAuth } from "firebase/auth";

const auth = getAuth();
const user = auth.currentUser;
const uid = user?.uid;

/** Global listener (kept for other parts of the app) */
export function listenToProducts(cb) {
  return onSnapshot(collection(db, "products"), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/** Per-vendor real-time listener (optional helper) */
export function listenToVendorProducts(vendorId, cb, onError = console.error) {
  if (!vendorId) return () => {};
  const q = query(
    collection(db, "products"),
    where("vendorId", "==", String(vendorId)),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

/** Write helper: coerce types & stamp server time */
export async function addProduct(product) {
  // Remove any legacy or seed vendorId (e.g., v_zen, v_green) and always use pharmacist UID
  const payload = {
    ...product,
    vendorId: String(product.vendorId), // must be pharmacist UID
    price: Number(product.price) || 0,
    stock: Number(product.stock) || 0,
    category: product.category || "Therapeutic",
    createdAt: serverTimestamp(),
  };
  // Defensive: if vendorId is not a UID, do not write
  if (!/^([A-Za-z0-9_-]{28,})$/.test(payload.vendorId)) throw new Error("Invalid vendorId (must be Firebase UID)");
  const ref = await addDoc(collection(db, "products"), payload);
  return ref.id;
}

export async function updateProduct(id, data) {
  await updateDoc(doc(db, "products", id), data);
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, "products", id));
}
