import { redirect } from "next/navigation";

export default function AccountPage() {
  // Redirecting /account to /profile for consistency
  redirect("/profile");
}
