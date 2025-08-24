// Firestore product helpers
import { db } from './firebase';
import { collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

export function listenToProducts(cb) {
  return onSnapshot(collection(db, 'products'), (snap) => {
    cb(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
}

export async function addProduct(product) {
  const ref = await addDoc(collection(db, 'products'), product);
  return ref.id;
}

export async function updateProduct(id, data) {
  await updateDoc(doc(db, 'products', id), data);
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, 'products', id));
}
