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

export async function updateProfile(uid, data) {
  await updateDoc(doc(db, 'users', uid), data);
}

// Ensure user profile exists and return the role
export async function ensureUserProfile({ uid, email, phone = '', defaultRole = 'customer', displayName = '' }) {
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    // If role or displayName is missing, set them
    const updates = {};
    if (!data.role) updates.role = defaultRole;
    if (defaultRole === 'customer' && !data.displayName && displayName) updates.displayName = displayName;
    if (Object.keys(updates).length > 0) {
      await updateDoc(docRef, updates);
    }
    return data.role || defaultRole;
  } else {
    // Create profile with default role and displayName
    const profile = { email, phone, role: defaultRole, createdAt: new Date().toISOString() };
    if (defaultRole === 'customer' && displayName) profile.displayName = displayName;
    await setDoc(docRef, profile);
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
