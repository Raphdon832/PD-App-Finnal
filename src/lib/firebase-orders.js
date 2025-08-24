// Firestore order helpers
import { db } from './firebase';
import { collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

export function listenToOrders(cb) {
  return onSnapshot(collection(db, 'orders'), (snap) => {
    cb(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
}

export async function addOrder(order) {
  const ref = await addDoc(collection(db, 'orders'), order);
  return ref.id;
}

export async function updateOrder(id, data) {
  await updateDoc(doc(db, 'orders', id), data);
}

export async function deleteOrder(id) {
  await deleteDoc(doc(db, 'orders', id));
}
