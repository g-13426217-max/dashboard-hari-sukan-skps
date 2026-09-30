import { getDashboardData } from "@/lib/data";
import { LiveDashboard } from "@/components/live-dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getDashboardData();
  return <LiveDashboard initialData={data} />;
}
