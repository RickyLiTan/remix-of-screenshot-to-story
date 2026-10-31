import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Empty } from "@/components/finance/ui";

export const Route = createFileRoute("/budget")({
  head: () => ({ meta: [{ title: "Budget — Common Ground" }, { name: "description", content: "Budget for your shared household." }, { property: "og:title", content: "Budget — Common Ground" }, { property: "og:description", content: "Budget for your shared household." }] }),
  component: () => (
    <div>
      <PageHeader eyebrow="Common Ground" title="Budget" />
      <Empty>This section is not built yet.</Empty>
    </div>
  ),
});
