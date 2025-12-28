// Simple client-side feature flags
const rawEnabled = (import.meta as any)?.env?.VITE_NOTIFICATIONS_ENABLED;
export const NOTIFICATIONS_ENABLED = String(rawEnabled).toLowerCase() === "true";

