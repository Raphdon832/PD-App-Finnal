// Firestore atomic product number increment and composite ID helpers
import { db } from './firebase';
import { doc, runTransaction } from 'firebase/firestore';

/**
 * Atomically increments the next product number for a pharmacy and returns the new product number.
 * @param {string} pharmId - The UID of the pharmacy (pharmacist's userId)
 * @returns {Promise<number>} The next product number (1-based)
 */
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

/**
 * Generates a composite product ID: {pharmId}-{paddedProductNumber}
 * @param {string} pharmId - The UID of the pharmacy
 * @param {number} productNumber - The product number (1-based)
 * @returns {string} The composite product ID
 */
export function makeProductId(pharmId, productNumber) {
  return `${pharmId}-${String(productNumber).padStart(3, '0')}`;
}

/**
 * Generates a composite cart ID: {customerId}_{pharmId}
 */
export function makeCartId(customerId, pharmId) {
  return `${customerId}_${pharmId}`;
}

/**
 * Generates a composite checkout/order ID: {productId}__{customerId}
 */
export function makeCheckoutId(productId, customerId) {
  return `${productId}__${customerId}`;
}

/**
 * Generates a chat thread ID: sorted([customerId, pharmId]).join('_')
 */
export function makeThreadId(customerId, pharmId) {
  return [customerId, pharmId].sort().join('_');
}
