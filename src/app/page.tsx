import Link from "next/link";
import {
  FileText,
  AlertTriangle,
  CheckSquare,
  Zap,
  Calendar,
  Shield,
  MessageSquare,
  ArrowRight,
  User,
  Building2,
  Mail,
  Download,
  GitGraph,
  Scale,
  Briefcase,
  Home,
  Handshake,
  FileSignature,
  PenTool,
  Users,
  GraduationCap,
  Landmark,
  ShieldCheck,
  Clock,
  Target,
  ChevronRight,
  Layers,
  Search,
  Cpu,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const useCases = [
  {
    icon: Briefcase,
    title: "Employment Contracts",
    description:
      "Non-competes, IP assignment, stock vesting, termination triggers. Know exactly what you are committing to before day one.",
    audience: "Job seekers · employees · HR teams",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-900",
  },
  {
    icon: PenTool,
    title: "Freelance & Contractor Agreements",
    description:
      "Payment terms, scope creep, kill fees, IP ownership. Stop delivering work on projects that may never pay.",
    audience: "Freelancers · agencies · consultants",
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-900",
  },
  {
    icon: Home,
    title: "Lease & Rental Agreements",
    description:
      "Security deposits, maintenance obligations, early termination penalties, automatic renewal traps. Protect your home.",
    audience: "Tenants · landlords · property managers",
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-900",
  },
  {
    icon: Shield,
    title: "NDAs & Confidentiality",
    description:
      "Scope, duration, carve-outs, survival clauses, remedies for breach. Understand what you can say — and for how long.",
    audience: "Founders · employees · partners",
    color: "text-slate-500",
    bg: "bg-slate-50 dark:bg-slate-950/30",
    border: "border-slate-200 dark:border-slate-900",
  },
  {
    icon: Handshake,
    title: "Service & SaaS Agreements",
    description:
      "SLAs, liability caps, data ownership, auto-renewals, indemnification clauses. Do not let a vendor lock you in without leverage.",
    audience: "Businesses · procurement · startups",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900",
  },
  {
    icon: Users,
    title: "Partnership & Shareholder Agreements",
    description:
      "Equity splits, decision rights, exit clauses, drag-along and tag-along. Align before you build together.",
    audience: "Co-founders · investors · business partners",
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-900",
  },
  {
    icon: Scale,
    title: "Settlement & Release Agreements",
    description:
      "What you are giving up, what you receive, confidentiality restrictions, non-disparagement. Understand the full trade-off.",
    audience: "Individuals in disputes · legal teams",
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-900",
  },
  {
    icon: FileSignature,
    title: "Loan & Financial Agreements",
    description:
      "Interest rates, default triggers, personal guarantees, collateral clauses. Know the real cost before you commit.",
    audience: "Borrowers · small businesses · investors",
    color: "text-teal-500",
    bg: "bg-teal-50 dark:bg-teal-950/30",
    border: "border-teal-200 dark:border-teal-900",
  },
];

const whoItsFor = [
  {
    icon: User,
    title: "Individuals",
    description:
      "Job seekers, tenants, freelancers — anyone handed a contract by a party with a legal team when you do not have one.",
  },
  {
    icon: Building2,
    title: "Small Businesses",
    description:
      "Startups, agencies, and growing teams that send and sign vendor, client, and partnership contracts without in-house counsel.",
  },
  {
    icon: PenTool,
    title: "Contract Drafters",
    description:
      "Generate jurisdiction-aware NDAs, service agreements, employment offers, and more — then verify them with an adversarial loophole check before sending.",
  },
  {
    icon: Landmark,
    title: "Lawyers & Paralegals",
    description:
      "First-pass review in seconds. Flag structural risks across high volumes. Generate balanced counter-proposals instantly.",
  },
  {
    icon: ShieldCheck,
    title: "HR & Procurement Teams",
    description:
      "Draft employment templates and vendor MSAs. Review incoming agreements at scale. Sender Mode surfaces your exposure.",
  },
  {
    icon: GraduationCap,
    title: "Students & Researchers",
    description:
      "Internship contracts, research agreements, publication rights. Understand what standard terms look like.",
  },
  {
    icon: Handshake,
    title: "Real Estate",
    description:
      "Lease reviews, purchase agreements, property management contracts. Know your obligations before you commit.",
  },
];

const features = [
  {
    icon: GitGraph,
    title: "Visual Contract Map",
    description:
      "Parties, obligations, powers, key dates, and risk indicators in one structured diagram — built from clause-level extraction, not summaries.",
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-900",
  },
  {
    icon: AlertTriangle,
    title: "Red Flags + Negotiation Emails",
    description:
      "Every risky clause flagged by severity. Each flag includes a ready-to-send negotiation email and precise alternative clause language.",
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-900",
  },
  {
    icon: Shield,
    title: "5 Structural Stress Tests",
    description:
      "Liability cap vs indemnity inter-play, sole remedy trap, successor risk, uncapped indemnity, and contra proferentem — applied automatically.",
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-900",
  },
  {
    icon: Scale,
    title: "Fairness Score",
    description:
      "A 0–100 balance score weighted by red flag severity, missing clause detection, and structural stress test outcomes.",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900",
  },
  {
    icon: FileSignature,
    title: "Generate Contracts",
    description:
      "Describe your requirements. Get a professionally drafted, adversarially reviewed contract with loophole detection built in.",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-900",
  },
  {
    icon: Zap,
    title: "Control Clause Extraction",
    description:
      "Termination rights, IP claims, non-compete scope, penalties, amendment powers — the clauses people miss until it is too late.",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900",
  },
  {
    icon: Calendar,
    title: "Key Dates Timeline",
    description:
      "Every date, duration, and deadline extracted and sorted by urgency. Notice periods, payment terms, and renewal traps.",
    color: "text-sky-500",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    border: "border-sky-200 dark:border-sky-900",
  },
  {
    icon: Download,
    title: "Export as PDF",
    description:
      "One-click export of the full analysis as a formatted PDF report. Or copy as plain text — ready to share with your team or counsel.",
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-900",
  },
  {
    icon: MessageSquare,
    title: "Ask Follow-Up Questions",
    description:
      '"What happens if I quit before 90 days?" "Can they change the scope unilaterally?" Answers grounded in your specific contract.',
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    border: "border-indigo-200 dark:border-indigo-900",
  },
  {
    icon: Mail,
    title: "Clause Rewrites",
    description:
      "In Detailed mode, each red flag includes a complete, balanced alternative clause — not a tip, the actual language you can propose.",
    color: "text-teal-500",
    bg: "bg-teal-50 dark:bg-teal-950/30",
    border: "border-teal-200 dark:border-teal-900",
  },
];

const pipeline = [
  {
    step: "1",
    icon: Search,
    title: "Contract Intelligence",
    description:
      "Identifies contract type (15 categories), jurisdiction, parties, and flags missing elements that may render the agreement unenforceable.",
    tag: "Classifier",
    tagColor: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
  },
  {
    step: "2",
    icon: Layers,
    title: "Parallel Extraction",
    description:
      "Three specialist agents run simultaneously on the full contract text — one for obligations, one for timeline, one for control clauses. No truncation.",
    tag: "3 agents in parallel",
    tagColor: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40",
  },
  {
    step: "3",
    icon: FileText,
    title: "Legal Synthesis",
    description:
      "A synthesis pass produces the plain-language summary, red flags with negotiation tips, missing clause checklist, and confidence score.",
    tag: "Streaming output",
    tagColor: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",
  },
  {
    step: "4",
    icon: Shield,
    title: "Structural Stress Tests",
    description:
      "Five structural legal tests: liability cap inter-play, sole remedy trap, successor risk, uncapped indemnity, and drafting ambiguity. The checks experienced counsel applies before signing.",
    tag: "5 tests",
    tagColor: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Paste or upload",
    description: "Paste contract text or upload a PDF. Any contract type, any language, any length.",
    icon: FileText,
  },
  {
    step: "2",
    title: "Parallel extraction",
    description:
      "Three specialist agents extract obligations, timeline, and control clauses from the full document simultaneously.",
    icon: Cpu,
  },
  {
    step: "3",
    title: "Review your report",
    description:
      "Red flags, stress tests, fairness score, and a plain-language summary — in under 20 seconds. Export as PDF.",
    icon: Target,
  },
];

const audienceLevels = [
  {
    label: "Simple",
    description: "Plain language, no jargon. Explains every clause as if talking to a first-time signer.",
    who: "Job seekers · tenants · students",
  },
  {
    label: "Informed",
    description: "Clear and direct. You have signed contracts before but you are not a lawyer.",
    who: "Freelancers · small business owners",
  },
  {
    label: "Detailed",
    description: "Full clause breakdown with section references, alternative clauses, and negotiation rewrites.",
    who: "Lawyers · procurement · experienced professionals",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="container max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <FileText className="h-5 w-5 text-primary" />
            <span>PlainContracts</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">
              Free &middot; No sign-up
            </span>
            <ThemeToggle />
            <Link
              href="/analyze"
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Analyse
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-muted text-muted-foreground px-3 py-1 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          Multi-agent extraction &middot; 5 structural tests &middot; Zero data retention
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6 leading-tight">
          Your contract,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
            reviewed like a lawyer
            <br />
            would review it.
          </span>
        </h1>

        <p className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">
          Paste any contract. Parallel agents extract every obligation, deadline, and control clause —
          then five structural stress tests check what experienced counsel checks before signing.
          Full report in under 20 seconds.
        </p>

        <p className="text-sm text-muted-foreground mb-10 max-w-xl mx-auto">
          Built for anyone who signs <em>or</em> drafts contracts without in-house counsel.
          Freelancers, founders, job seekers, HR teams, tenants, businesses, and legal professionals.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/analyze"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-base font-semibold px-8 py-3.5 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            Analyse a Contract
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/generate"
            className="inline-flex items-center justify-center gap-2 border-2 border-primary text-primary text-base font-semibold px-8 py-3.5 rounded-lg hover:bg-primary/5 transition-colors"
          >
            Generate a Contract
            <PenTool className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="container max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-center mb-3">How it works</h2>
        <p className="text-center text-muted-foreground mb-10 text-sm">
          Three steps. Under 20 seconds. Complete structured analysis.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {howItWorks.map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                Step {item.step}
              </div>
              <h3 className="text-base font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Analysis Pipeline */}
      <section className="bg-muted/30 border-y border-border">
        <div className="container max-w-5xl mx-auto px-4 py-20">
          <h2 className="text-2xl font-bold text-center mb-2">
            A four-stage analysis pipeline
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-sm max-w-2xl mx-auto">
            Most tools summarise contracts. PlainContracts extracts, cross-references, and
            stress-tests them — the same process a litigation-experienced attorney applies.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {pipeline.map((stage) => (
              <div key={stage.step} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <stage.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stage.tagColor}`}>
                    {stage.tag}
                  </span>
                </div>
                <h3 className="text-sm font-bold mb-1.5">{stage.step}. {stage.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{stage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two Perspectives */}
      <section className="container max-w-4xl mx-auto px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-8">
          <h2 className="text-lg font-semibold mb-2 text-center">
            Two perspectives. One contract.
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Switch between Signer and Sender mode to see the contract from both sides.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border-2 border-primary/30 p-5 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-primary" />
                <span className="font-semibold">Signer Mode</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                &ldquo;What does this contract mean <strong className="text-foreground">for me</strong>?&rdquo;
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-1.5"><ChevronRight className="h-3 w-3 text-primary" /> Your obligations and deliverables</li>
                <li className="flex items-center gap-1.5"><ChevronRight className="h-3 w-3 text-primary" /> Unilateral powers the other party holds</li>
                <li className="flex items-center gap-1.5"><ChevronRight className="h-3 w-3 text-primary" /> Red flags that disadvantage you</li>
                <li className="flex items-center gap-1.5"><ChevronRight className="h-3 w-3 text-primary" /> Contra proferentem stress test applied</li>
              </ul>
            </div>
            <div className="rounded-lg border-2 border-amber-500/30 p-5 bg-amber-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-amber-500" />
                <span className="font-semibold">Sender Mode</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                &ldquo;What does this <strong className="text-foreground">expose my business</strong> to?&rdquo;
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-1.5"><ChevronRight className="h-3 w-3 text-amber-500" /> IP ownership gaps and weak assignment clauses</li>
                <li className="flex items-center gap-1.5"><ChevronRight className="h-3 w-3 text-amber-500" /> Missing liability caps and uncapped exposure</li>
                <li className="flex items-center gap-1.5"><ChevronRight className="h-3 w-3 text-amber-500" /> Data privacy and GDPR/CCPA obligations</li>
                <li className="flex items-center gap-1.5"><ChevronRight className="h-3 w-3 text-amber-500" /> Performance standard ambiguity</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Levels */}
      <section className="container max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center mb-2">
          Three depth levels
        </h2>
        <p className="text-sm text-center text-muted-foreground mb-8">
          Choose the detail level that matches your experience and purpose.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {audienceLevels.map((level) => (
            <div
              key={level.label}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="text-base font-bold mb-1">{level.label}</div>
              <p className="text-sm text-muted-foreground mb-3">{level.description}</p>
              <p className="text-xs text-primary font-medium">{level.who}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-muted/30 border-y border-border">
        <div className="container max-w-6xl mx-auto px-4 py-20">
          <h2 className="text-2xl font-bold text-center mb-2">
            Works with any contract type
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-sm max-w-xl mx-auto">
            Employment, freelance, real estate, NDAs, SaaS, partnerships, loans, settlements —
            15 contract types with specialised extraction and required-clause checklists.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {useCases.map((uc) => (
              <div
                key={uc.title}
                className={`rounded-xl border p-5 ${uc.bg} ${uc.border} transition-shadow hover:shadow-md`}
              >
                <uc.icon className={`h-5 w-5 mb-3 ${uc.color}`} />
                <h3 className="text-sm font-bold mb-1.5">{uc.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {uc.description}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  {uc.audience}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="container max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold text-center mb-2">
          Built for people who sign — and draft — contracts
        </h2>
        <p className="text-center text-muted-foreground mb-12 text-sm">
          Whether you are receiving a contract or sending one, PlainContracts gives you the analysis and the drafting tools to act from a position of clarity.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {whoItsFor.map((item) => (
            <div key={item.title} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 border-y border-border">
        <div className="container max-w-6xl mx-auto px-4 py-20">
          <h2 className="text-2xl font-bold text-center mb-3">
            Everything a lawyer checks — built into the report
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-sm max-w-xl mx-auto">
            Clause-level extraction, adversarial stress testing, and plain-language translation — all in one structured output.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className={`rounded-xl border p-4 ${f.bg} ${f.border}`}
              >
                <f.icon className={`h-5 w-5 mb-3 ${f.color}`} />
                <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Generate CTA */}
      <section className="container max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-10">
          <PenTool className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">
            Need a contract? Generate one.
          </h2>
          <p className="text-muted-foreground mb-2 text-sm max-w-lg mx-auto">
            Describe your requirements in plain language. PlainContracts generates a complete,
            jurisdiction-aware contract — then runs an adversarial loophole check before delivery.
          </p>
          <p className="text-xs text-muted-foreground mb-8">
            NDAs, service agreements, freelance contracts, employment offers, SaaS terms, and more.
            Export as PDF — ready to sign or review with counsel.
          </p>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-base font-semibold px-8 py-3.5 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            Generate a Contract
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-muted/30">
        <div className="container max-w-2xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">
            Stop signing contracts you do not fully understand.
          </h2>
          <p className="text-muted-foreground mb-8 text-sm">
            Free. No account. No data stored. Your contract is never retained or used beyond the analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-base font-semibold px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Analyse a Contract
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/generate"
              className="inline-flex items-center justify-center gap-2 border border-border bg-background text-foreground text-base font-medium px-8 py-3 rounded-lg hover:bg-accent transition-colors"
            >
              Generate a Contract
              <PenTool className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            <span>PlainContracts</span>
          </div>
          <p>
            Contract analysis and drafting tool. Not legal advice. Consult a qualified attorney before signing.
          </p>
        </div>
      </footer>
    </div>
  );
}
