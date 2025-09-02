// Firestore chat helpers
import { db } from './firebase';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';

export function listenToConversations(userId, role, cb) {
  // Listen to all conversations for this user (customer or pharmacist)
  let q;
  if (role === 'customer') {
    q = query(collection(db, 'conversations'), where('customerId', '==', userId));
  } else if (role === 'pharmacist') {
    q = query(collection(db, 'conversations'), where('vendorId', '==', userId));
  } else {
    return () => {};
  }
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    cb(data);
  });
}

// Always use threadId = `${customerId}_${pharmId}` and messages: [{ senderId, text, timestamp }]
export async function sendMessage(threadId, message) {
  const payload = {
    senderId: message.senderId,
    text: message.text,
    timestamp: message.timestamp,
    attachments: message.attachments,
    replyTo: message.replyTo,
  };
  const msgRef = collection(db, 'conversations', threadId, 'messages');
  await addDoc(msgRef, {
    ...payload,
    at: serverTimestamp(),
  });
}

export function listenToMessages(conversationId, cb) {
  const q = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('at'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
}

export async function createConversation(data) {
  // data: { vendorId, customerId, ... }
  const ref = await addDoc(collection(db, 'conversations'), data);
  return ref.id;
}
