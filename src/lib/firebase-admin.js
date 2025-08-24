// Firebase admin helpers for super user (client-side demo only)
// In production, use secure server-side admin SDK!
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';

export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function setSuperUser(uid) {
  // Mark a user as super user (admin claim)
  await setDoc(doc(db, 'superusers', uid), { isSuper: true }, { merge: true });
}

export async function updateUser(uid, data) {
  await updateDoc(doc(db, 'users', uid), data);
}
