import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Empty } from "@/components/finance/ui";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Common Ground" }, { name: "description", content: "Reports for your shared household." }, { property: "og:title", content: "Reports — Common Ground" }, { property: "og:description", content: "Reports for your shared household." }] }),
  component: () => (
    <div>
      <PageHeader eyebrow="Common Ground" title="Reports" />
      <Empty>This section is not built yet.</Empty>
    </div>
  ),
});
