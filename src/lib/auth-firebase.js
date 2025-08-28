// src/lib/auth-firebase.js
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { ensureUserProfile } from "./firebase-profiles";

export async function signUpWithEmail({ email, password, phone, role = "customer", displayName = "" }) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  const savedRole = await ensureUserProfile({
    uid: user.uid,
    email: user.email,
    phone: phone || user.phoneNumber || "",
    defaultRole: role,
    displayName: role === "customer" ? displayName : undefined,
  });
  return { uid: user.uid, role: savedRole };
}

export async function signInWithEmailAndEnsureProfile({ email, password, displayName = "" }) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const role = await ensureUserProfile({
    uid: user.uid,
    email: user.email,
    phone: user.phoneNumber || "",
    defaultRole: "customer",
    displayName,
  });
  return { uid: user.uid, role };
}

export async function logout() {
  await signOut(auth);
}
