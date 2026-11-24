"use client";

import { useState } from "react";
import Link from "next/link";
import type { PaidSection, PublicReport } from "@/types";
import { GOAL_LABELS } from "@/types";
import { Badge } from "@/components/ui/Card";
import { formatINR } from "@/lib/format";
import { ProsConsGrid, RentYieldSummary, VerdictCard } from "./FreeSections";
import { FinancialTable, InfraScore, RiskChecklist } from "./PaidSections";
import LockedPreview from "./LockedPreview";
import Paywall from "./Paywall";

export default function ReportView({ report, disclaimer }: { report: PublicReport; disclaimer: string }) {
  const [paid, setPaid] = useState<PaidSection | null>(report.paid_section);
  const { input, free_section: free, localityNames: names } = report;

  return (
    <div className="space-y-10 pt-8">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Link href="/" className="text-muted hover:text-accent">← New comparison</Link>
        <span className="text-line">|</span>
        <span className="num text-muted">REPORT {report.id.slice(0, 8).toUpperCase()}</span>
        <span className="ml-auto flex flex-wrap gap-1.5">
          <Badge>{input.city}</Badge>
          <Badge>{input.property_type}</Badge>
          <Badge>{GOAL_LABELS[input.goal]}</Badge>
          <Badge>{formatINR(input.budget_inr)}</Badge>
          {input.loan_pct != null ? <Badge>{input.loan_pct}% loan</Badge> : null}
          <Badge tone={free.analysis_source === "claude" ? "green" : "gray"}>
            {free.analysis_source === "claude" ? "AI analysis" : "Rule-based analysis"}
          </Badge>
        </span>
      </div>

      <VerdictCard free={free} names={names} />
      <RentYieldSummary free={free} propertyType={input.property_type} />
      <ProsConsGrid free={free} names={names} />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="num text-[11px] uppercase tracking-[0.2em] text-muted">{paid ? "Full report unlocked" : "Premium deep-dive"}</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      {paid ? (
        <div className="space-y-10">
          <FinancialTable paid={paid} input={input} />
          <InfraScore paid={paid} names={names} />
          <RiskChecklist paid={paid} names={names} />
        </div>
      ) : (
        <div className="relative">
          <LockedPreview />
          <div className="absolute inset-0 flex items-start justify-center pt-10">
            <Paywall reportId={report.id} onUnlock={setPaid} />
          </div>
        </div>
      )}

      <p className="rounded-lg border border-line bg-panel/60 p-4 text-[11px] leading-relaxed text-muted">
        <span className="font-semibold text-warn">Data note:</span> {disclaimer} Stamp duty and registration use approximate state
        rates. This report is research support, not financial, legal or tax advice.
      </p>
    </div>
  );
}
