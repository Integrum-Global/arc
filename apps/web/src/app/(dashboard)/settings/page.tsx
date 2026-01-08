/**
 * Settings Index Page
 *
 * Redirects to the profile settings page.
 */

import { redirect } from "next/navigation";

export default function SettingsPage() {
  redirect("/settings/profile");
}
