import axios from "axios";

const WALLET_BASE = "https://afia-bridge-transactions.onrender.com";

const walletClient = axios.create({ baseURL: WALLET_BASE });

// ── Wallet ─────────────────────────────────────────────────────────────────────
// GET /wallet/:user_id — get or create wallet for user
export const getWallet = (userId) =>
  walletClient.get(`/wallet/${userId}`);

// ── Transactions ──────────────────────────────────────────────────────────────
// POST /pay-mpesa — M-Pesa STK push deposit
export const depositMpesa = (data) =>
  walletClient.post("/pay-mpesa", data);
// data: { email, user_id, amount, phone }

// POST /pay/provider — internal transfer patient → provider
export const payProvider = (data) =>
  walletClient.post("/pay/provider", data);
// data: { patient_id, target_id, target_phone, amount }

// POST /wallet/withdraw — withdraw to M-Pesa
export const withdrawToMpesa = (data) =>
  walletClient.post("/wallet/withdraw", data);
// data: { user_id, amount, phone }

// ── Helpers ───────────────────────────────────────────────────────────────────
// Decode base64 JSON fields returned by the wallet API
export function decodeWalletField(base64Str) {
  if (!base64Str) return [];
  try {
    return JSON.parse(atob(base64Str));
  } catch {
    return [];
  }
}