import { getCurrentUserAction } from "@/actions/auth";
  import ClientDashboardLayout from "./ClientDashboardLayout";


  export default async function DashboardServer({ children }: { children: React.ReactNode }) {
    let user = null;
    let error = null;

    try {
      user = await getCurrentUserAction();
      console.log("DashboardServer: Fetched user:", user);
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to fetch user";
      console.error("DashboardServer: Error fetching user:", error);
    }

    return (
      <ClientDashboardLayout user={user} error={error}>
        {children}
      </ClientDashboardLayout>
    );
  }