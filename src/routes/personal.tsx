import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Empty } from "@/components/finance/ui";

export const Route = createFileRoute("/personal")({
  head: () => ({ meta: [{ title: "Personal — Common Ground" }, { name: "description", content: "Personal for your shared household." }, { property: "og:title", content: "Personal — Common Ground" }, { property: "og:description", content: "Personal for your shared household." }] }),
  component: () => (
    <div>
      <PageHeader eyebrow="Common Ground" title="Personal" />
      <Empty>This section is not built yet.</Empty>
    </div>
  ),
});
