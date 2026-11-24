import { notFound } from "next/navigation";
import ReportView from "@/components/report/ReportView";
import { getReport } from "@/lib/store";
import { toPublic } from "@/lib/report";
import { DATA_DISCLAIMER } from "@/lib/markets";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getReport(id);
  if (!record) notFound();
  return <ReportView report={toPublic(record)} disclaimer={DATA_DISCLAIMER} />;
}
