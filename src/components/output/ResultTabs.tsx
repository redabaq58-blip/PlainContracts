"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
  FileText,
  CheckSquare,
  Zap,
  AlertTriangle,
  Search,
  Calendar,
  Shield,
  MessageSquare,
} from "lucide-react";
import { SectionCard } from "./SectionCard";
import { RedFlagsPanel } from "./RedFlagsPanel";
import { TimelinePanel } from "./TimelinePanel";
import { ConfidencePanel } from "./ConfidencePanel";
import { QAPanel } from "./QAPanel";
import { cn } from "@/lib/utils/cn";
import type {
  ParsedSections,
  AnalysisStatus,
  Layer1Result,
  Layer3Result,
} from "@/types";

interface ResultTabsProps {
  sections: ParsedSections;
  status: AnalysisStatus;
  layer1Result: Layer1Result | null;
  layer3Result: Layer3Result | null;
  contractText: string;
  privacyMode?: boolean;
}

const tabs = [
  { id: "SUMMARY", label: "Summary", shortLabel: "Summary", icon: FileText, sectionKey: "SUMMARY" as const },
  { id: "OBLIGATIONS", label: "Obligations", shortLabel: "Obligations", icon: CheckSquare, sectionKey: "OBLIGATIONS" as const },
  { id: "POWERS", label: "Their Powers", shortLabel: "Powers", icon: Zap, sectionKey: "POWERS" as const },
  { id: "REDFLAGS", label: "Red Flags", shortLabel: "Flags", icon: AlertTriangle, sectionKey: "REDFLAGS" as const },
  { id: "MISSING", label: "Missing Clauses", shortLabel: "Missing", icon: Search, sectionKey: "MISSING" as const },
  { id: "TIMELINE", label: "Key Dates", shortLabel: "Dates", icon: Calendar, sectionKey: "TIMELINE" as const },
  { id: "CONFIDENCE", label: "Confidence", shortLabel: "Score", icon: Shield, sectionKey: "CONFIDENCE" as const },
  { id: "QA", label: "Ask", shortLabel: "Ask", icon: MessageSquare, sectionKey: null },
];

const isStreaming = (status: AnalysisStatus) =>
  status === "streaming" || status === "verifying";

export function ResultTabs({
  sections,
  status,
  layer1Result,
  layer3Result,
  contractText,
  privacyMode,
}: ResultTabsProps) {
  return (
    <TabsPrimitive.Root defaultValue="SUMMARY" className="w-full">
      {/* Tab list */}
      <TabsPrimitive.List className="flex gap-1 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.id}
            value={tab.id}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all shrink-0",
              "text-muted-foreground hover:text-foreground",
              "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
              "border border-transparent data-[state=active]:border-border"
            )}
          >
            <tab.icon className="h-3 w-3" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
            {tab.id === "REDFLAGS" && sections.REDFLAGS && (() => {
              try {
                const flags = JSON.parse(sections.REDFLAGS);
                if (Array.isArray(flags) && flags.length > 0) {
                  return (
                    <span className="ml-0.5 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xs leading-none">
                      {flags.length}
                    </span>
                  );
                }
              } catch { return null; }
              return null;
            })()}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>

      {/* Tab content */}
      <TabsPrimitive.Content value="SUMMARY" className="focus:outline-none">
        <SectionCard
          title="Plain Summary"
          icon={FileText}
          content={sections.SUMMARY}
          streaming={isStreaming(status)}
        />
      </TabsPrimitive.Content>

      <TabsPrimitive.Content value="OBLIGATIONS" className="focus:outline-none">
        <SectionCard
          title="Your Obligations"
          icon={CheckSquare}
          content={sections.OBLIGATIONS}
          streaming={isStreaming(status)}
        />
      </TabsPrimitive.Content>

      <TabsPrimitive.Content value="POWERS" className="focus:outline-none">
        <SectionCard
          title="Their Powers"
          icon={Zap}
          content={sections.POWERS}
          streaming={isStreaming(status)}
        />
      </TabsPrimitive.Content>

      <TabsPrimitive.Content value="REDFLAGS" className="focus:outline-none">
        <RedFlagsPanel
          content={sections.REDFLAGS}
          streaming={isStreaming(status)}
        />
      </TabsPrimitive.Content>

      <TabsPrimitive.Content value="MISSING" className="focus:outline-none">
        <SectionCard
          title="Missing Clauses"
          icon={Search}
          content={sections.MISSING}
          streaming={isStreaming(status)}
        />
      </TabsPrimitive.Content>

      <TabsPrimitive.Content value="TIMELINE" className="focus:outline-none">
        <TimelinePanel
          content={sections.TIMELINE}
          streaming={isStreaming(status)}
        />
      </TabsPrimitive.Content>

      <TabsPrimitive.Content value="CONFIDENCE" className="focus:outline-none">
        <ConfidencePanel
          content={sections.CONFIDENCE}
          layer1Result={layer1Result}
          layer3Result={layer3Result}
          streaming={isStreaming(status)}
        />
      </TabsPrimitive.Content>

      <TabsPrimitive.Content value="QA" className="focus:outline-none">
        <div className="rounded-lg border border-border bg-card p-4">
          <QAPanel
            contractText={contractText}
            sections={sections}
            layer1Result={layer1Result}
            privacyMode={privacyMode}
          />
        </div>
      </TabsPrimitive.Content>
    </TabsPrimitive.Root>
  );
}
