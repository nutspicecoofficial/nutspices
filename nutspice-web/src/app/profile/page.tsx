import { redirect } from "next/navigation";

export default function ProfilePage() {
  // Currently, the main profile content is in orders. 
  // Redirecting to the orders page as the default profile view.
  redirect("/profile/orders");
}
