import { getCurrentUserAction } from "apps/user-ui/src/actions/auth";
import Sidebar from "../../shared/widgets/dashboard/sidebar";

export default async function SidebarServer() {
  let user = null;
  let error = null;

  try {
    user = await getCurrentUserAction();
    console.log("SidebarServer: Fetched user:", user);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to fetch user";
    console.error("SidebarServer: Error fetching user:", error);
  }

  return <Sidebar user={user} error={error} />;
}