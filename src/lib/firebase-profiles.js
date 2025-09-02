// Firestore profile helpers
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, updateDoc, onSnapshot, setDoc, runTransaction } from 'firebase/firestore';

export function listenToProfiles(cb) {
  return onSnapshot(collection(db, 'users'), (snap) => {
    cb(snap.docs.map(doc => ({ id: doc.id, uid: doc.id, ...doc.data() })));
  });
}

export async function getProfile(uid) {
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Always use user.uid, type, name, email, phone, address, location, createdAt
export async function updateProfile(uid, data) {
  const payload = {
    uid,
    type: data.type,
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    location: data.location,
    createdAt: data.createdAt,
  };
  await updateDoc(doc(db, 'users', uid), payload);
}

// Fix: Always use 'type' for user role, not 'role'.
// Patch ensureUserProfile to set and return 'type' (not 'role')
export async function ensureUserProfile({ uid, email, phone = '', defaultRole = 'customer' }) {
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    // If type is missing, set it
    if (!data.type) {
      await updateDoc(docRef, { type: defaultRole });
      return defaultRole;
    }
    return data.type;
  } else {
    // Create profile with default type
    await setDoc(docRef, { email, phone, type: defaultRole, createdAt: new Date().toISOString() });
    return defaultRole;
  }
}

export async function getNextProductNumber(pharmId) {
  const counterRef = doc(db, 'pharmacies', pharmId, 'meta', 'counters');
  return await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    let next = 1;
    if (counterSnap.exists()) {
      const data = counterSnap.data();
      next = (data.nextProductNumber || 1);
    }
    transaction.set(counterRef, { nextProductNumber: next + 1 }, { merge: true });
    return next;
  });
}

export function makeProductId(pharmId, productNumber) {
  return `${pharmId}-${String(productNumber).padStart(3, '0')}`;
}

export function makeCartId(customerId, pharmId) {
  return `${customerId}_${pharmId}`;
}

export function makeCheckoutId(productId, customerId) {
  return `${productId}__${customerId}`;
}

export function makeThreadId(customerId, pharmId) {
  return [customerId, pharmId].sort().join('_');
}
