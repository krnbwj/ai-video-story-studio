import { AppShell } from "@/components/app-shell";
import { CreateWizard } from "@/components/create-wizard";

export default function NewProjectPage() {
  return (
    <AppShell title="Create new story">
      <CreateWizard />
    </AppShell>
  );
}
