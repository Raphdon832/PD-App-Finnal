// Firestore profile helpers
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, updateDoc, onSnapshot } from 'firebase/firestore';

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
