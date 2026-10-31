import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Empty } from "@/components/finance/ui";

export const Route = createFileRoute("/goals")({
  head: () => ({ meta: [{ title: "Goals — Common Ground" }, { name: "description", content: "Goals for your shared household." }, { property: "og:title", content: "Goals — Common Ground" }, { property: "og:description", content: "Goals for your shared household." }] }),
  component: () => (
    <div>
      <PageHeader eyebrow="Common Ground" title="Goals" />
      <Empty>This section is not built yet.</Empty>
    </div>
  ),
});
