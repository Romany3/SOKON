/**
 * Inline SVG placeholder images used when the real image is unavailable.
 * These never fail to load because they are data URIs — no network required.
 */

// Generic apartment/property image (blue-grey rectangle with a house icon silhouette)
export const APARTMENT_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e2e8f0'/%3E%3Crect x='120' y='100' width='160' height='130' fill='%2394a3b8'/%3E%3Cpolygon points='100,105 200,45 300,105' fill='%2364748b'/%3E%3Crect x='165' y='175' width='40' height='55' fill='%23e2e8f0'/%3E%3Crect x='130' y='120' width='35' height='35' fill='%23cbd5e1'/%3E%3Crect x='235' y='120' width='35' height='35' fill='%23cbd5e1'/%3E%3C/svg%3E";

// Generic square apartment placeholder (400x400)
export const APARTMENT_PLACEHOLDER_SQ =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23e2e8f0'/%3E%3Crect x='100' y='150' width='200' height='180' fill='%2394a3b8'/%3E%3Cpolygon points='80,155 200,70 320,155' fill='%2364748b'/%3E%3Crect x='165' y='260' width='50' height='70' fill='%23e2e8f0'/%3E%3Crect x='110' y='170' width='45' height='45' fill='%23cbd5e1'/%3E%3Crect x='245' y='170' width='45' height='45' fill='%23cbd5e1'/%3E%3C/svg%3E";

// User avatar placeholder — simple face silhouette
export const AVATAR_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23e2e8f0'/%3E%3Ccircle cx='100' cy='80' r='40' fill='%2394a3b8'/%3E%3Cellipse cx='100' cy='175' rx='60' ry='40' fill='%2394a3b8'/%3E%3C/svg%3E";

// Small avatar placeholder (32-48px contexts)
export const AVATAR_SM_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' rx='40' fill='%23e2e8f0'/%3E%3Ccircle cx='40' cy='30' r='16' fill='%2394a3b8'/%3E%3Cellipse cx='40' cy='68' rx='22' ry='14' fill='%2394a3b8'/%3E%3C/svg%3E";
