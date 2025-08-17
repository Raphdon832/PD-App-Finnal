// Minimal local-first auth (hashed passwords) for PD prototype

const USERS_KEY = "PD_USERS_V1";

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function sha256Hex(str) {
  if (crypto?.subtle) {
    const data = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback (non-cryptographic)
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
  return ("00000000" + (h >>> 0).toString(16)).slice(-8);
}

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

export async function createUser(user) {
  const users = loadUsers();
  const email = normalizeEmail(user.email);
  if (!email) throw new Error("Enter a valid email");
  if (users.some(u => u.email === email)) throw new Error("An account with this email already exists");
  if (!user.password) throw new Error("Enter a password");

  const salt = Math.random().toString(36).slice(2, 10);
  const passwordHash = await sha256Hex(user.password + ":" + salt);

  const record = {
    id: `u_${Date.now().toString(36)}`,
    role: user.role,
    email,
    name: user.name?.trim() || "",
    phone: user.phone || "",
    passwordHash,
    salt,
    pharmacyName: user.pharmacyName || null,
    pharmacyAddress: user.pharmacyAddress || null,
    pharmacyLocation: user.pharmacyLocation || null,
    createdAt: new Date().toISOString(),
  };

  users.push(record);
  saveUsers(users);
  const { passwordHash: _, salt: __, ...safe } = record;
  return safe;
}

export async function signIn(email, password) {
  const users = loadUsers();
  const e = normalizeEmail(email);
  const u = users.find(x => x.email === e);
  if (!u) throw new Error("No account found for this email");
  const hash = await sha256Hex(password + ":" + u.salt);
  if (hash !== u.passwordHash) throw new Error("Incorrect password");
  const { passwordHash: _, salt: __, ...safe } = u;
  return safe;
}
