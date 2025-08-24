// Firestore profile helpers
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';

export function listenToProfiles(cb) {
  return onSnapshot(collection(db, 'users'), (snap) => {
    cb(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
export async function ensureUserProfile({ uid, email, phone = '', defaultRole = 'customer' }) {
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    // If role is missing, set it
    if (!data.role) {
      await updateDoc(docRef, { role: defaultRole });
      return defaultRole;
    }
    return data.role;
  } else {
    // Create profile with default role
    await setDoc(docRef, { email, phone, role: defaultRole, createdAt: new Date().toISOString() });
    return defaultRole;
  }
}
