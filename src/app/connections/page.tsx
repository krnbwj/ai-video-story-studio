import { AppShell } from "@/components/app-shell";
import { ConnectionsPanel } from "@/components/connections-panel";

export default function ConnectionsPage() {
  return (
    <AppShell title="Provider Connections">
      <ConnectionsPanel />
    </AppShell>
  );
}
