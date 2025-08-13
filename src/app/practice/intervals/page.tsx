import { AppLayout } from "@/components/app/AppLayout";
import IntervalsPracticeClient from "@/components/practice/IntervalsPracticeClient";
import { prisma } from "@/lib/db/prisma";

export default async function IntervalsPracticePage() {
  const existing = await prisma.drill.findFirst({
    where: { type: "INTERVAL", name: "Intervals" },
    select: { id: true },
  });

  let drillId = existing?.id;
  if (!drillId) {
    const created = await prisma.drill.create({
      data: {
        type: "INTERVAL",
        name: "Intervals",
        config: { mode: "major" },
      },
      select: { id: true },
    });
    drillId = created.id;
  }

  return (
    <AppLayout>
      <IntervalsPracticeClient drillId={drillId} />
    </AppLayout>
  );
}


