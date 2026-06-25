import { AppShell } from "@/components/layout/AppShell";
import { getSystemStatus } from "@/lib/api";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const systemStatus = await getSystemStatus();

  return <AppShell systemStatus={systemStatus}>{children}</AppShell>;
}
