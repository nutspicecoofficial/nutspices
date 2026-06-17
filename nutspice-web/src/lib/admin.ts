import { cookies } from "next/headers";

/**
 * Retrieves the list of authorized admin numbers from the ADMIN_PHONES / ADMIN_PHONE / ADMIN_NUMBERS env variables.
 * Fallback is "9704761386". Numbers are normalized by stripping non-digits and keeping the last 10 digits.
 */
export function getAdminNumbers(): string[] {
  const adminNumbersEnv =
    process.env.ADMIN_PHONES ||
    process.env.ADMIN_PHONE ||
    process.env.ADMIN_NUMBERS ||
    "9704761386";
  return adminNumbersEnv
    .split(",")
    .map((n) => n.trim().replace(/\D/g, "").slice(-10))
    .filter(Boolean);
}

/**
 * Checks if the given phone number is one of the authorized admin numbers.
 * The check compares the last 10 digits of the normalized numbers.
 */
export function isAdminNumber(phone: string): boolean {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, "");
  const p10 = cleanPhone.slice(-10);
  const adminNumbers = getAdminNumbers();
  return adminNumbers.includes(p10);
}

/**
 * Compatibility alias for dynamically imported checks.
 */
export function isAdmin(session: string): boolean {
  return isAdminNumber(session);
}

/**
 * Server-side helper to authenticate an admin session based on cookies.
 */
export async function checkAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session")?.value;
    return session ? isAdminNumber(session) : false;
  } catch (error) {
    console.error("Failed to read admin session cookie:", error);
    return false;
  }
}
