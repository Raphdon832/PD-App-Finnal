// src/lib/useProfileListener.js
import { useEffect } from "react";
import { listenToProfiles } from "@/lib/firebase-profiles";

/**
 * Listen to the current user's profile in Firestore and call onUpdate with the latest profile.
 * @param {string} uid - Firebase Auth UID
 * @param {(profile: object|null) => void} onUpdate - Callback to update profile state
 */
export default function useProfileListener(uid, onUpdate) {
  useEffect(() => {
    if (!uid) return;
    // Listen to all profiles, filter for current user
    const unsub = listenToProfiles((profiles) => {
      const me = profiles.find((p) => p.id === uid);
      if (me) onUpdate(me);
    });
    return () => unsub && unsub();
  }, [uid, onUpdate]);
}
