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
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const features = [
  {
    icon: AlertTriangle,
    title: "Red Flags + Negotiation Emails",
    description:
      "Every risky clause flagged by severity. One click copies a complete, professional negotiation email you can send immediately.",
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-900",
  },
  {
    icon: Zap,
    title: "Their Powers — What You're Missing",
    description:
      "Every right they have over you: termination, IP ownership, non-compete scope, penalties. The section nobody reads until it's too late.",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900",
  },
  {
    icon: Calendar,
    title: "Key Dates Timeline",
    description:
      "Every date, duration, and deadline extracted and visualised. Notice periods. Non-compete durations. Payment terms. At a glance.",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-900",
  },
  {
    icon: User,
    title: "Signer vs. Sender Mode",
    description:
      "Toggle the entire analysis perspective. Signer: what does this mean for me? Sender: what does this expose my business to?",
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-900",
  },
  {
    icon: CheckSquare,
    title: "Your Obligations Only",
    description:
      "Not a summary of the whole contract — exactly what YOU must do, deliver, or avoid. Extracted from your perspective alone.",
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-900",
  },
  {
    icon: MessageSquare,
    title: "Q&A Mode",
    description:
      '"What happens if I quit before 90 days?" Ask any follow-up question about your contract and get a direct answer instantly.',
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    border: "border-indigo-200 dark:border-indigo-900",
  },
  {
    icon: Shield,
    title: "Privacy Mode",
    description:
      "Toggle on to add Anthropic's no-training header. Your contract text is never stored, logged, or used for training. Ever.",
    color: "text-slate-500",
    bg: "bg-slate-50 dark:bg-slate-950/30",
    border: "border-slate-200 dark:border-slate-900",
  },
  {
    icon: Mail,
    title: "Clause Rewrites",
    description:
      "In Detailed mode, every red flag includes a complete, fair alternative clause you can propose — not just a tip, the actual language.",
    color: "text-teal-500",
    bg: "bg-teal-50 dark:bg-teal-950/30",
    border: "border-teal-200 dark:border-teal-900",
  },
];

const audienceLevels = [
  {
    label: "Simple",
    description: "First-time signers. No jargon. Just plain English.",
  },
  {
    label: "Informed",
    description: "You've signed contracts before. Clear, direct language.",
  },
  {
    label: "Detailed",
    description: "Full clause breakdown + negotiation rewrites.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="container max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <FileText className="h-5 w-5" />
            <span>PlainContracts</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">
              Free · No sign-up
            </span>
            <ThemeToggle />
            <Link
              href="/analyze"
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Analyze a contract
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-muted text-muted-foreground px-3 py-1 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          Powered by Claude AI · Free for everyone
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
          Paste your contract.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
            Know exactly what
            <br />
            you&apos;re agreeing to.
          </span>
        </h1>

        <p className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">
          7 plain-language outputs in 15 seconds. Red flags. Obligations.
          Their powers over you. Key dates. Negotiation emails ready to send.
        </p>

        <p className="text-sm text-muted-foreground mb-10">
          For freelancers, job seekers, renters — people who receive contracts
          from companies with legal teams and have no one on their side.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/analyze"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-base font-semibold px-8 py-3 rounded-md hover:bg-primary/90 transition-colors"
          >
            Analyse a contract
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/analyze"
            className="inline-flex items-center justify-center gap-2 border border-border bg-background text-foreground text-base font-medium px-8 py-3 rounded-md hover:bg-accent transition-colors"
          >
            Try with a sample
          </Link>
        </div>
      </section>

      {/* Mode demo */}
      <section className="container max-w-4xl mx-auto px-4 pb-16">
        <div className="rounded-2xl border border-border bg-card p-8">
          <h2 className="text-lg font-semibold mb-6 text-center">
            Two perspectives. One contract.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-background">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Signer Mode</span>
              </div>
              <p className="text-sm text-muted-foreground">
                What does this contract mean <strong className="text-foreground">for me</strong> as the person signing? What am I agreeing to?
              </p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-background">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Sender Mode</span>
              </div>
              <p className="text-sm text-muted-foreground">
                What does this contract <strong className="text-foreground">expose my business to</strong>? What risks am I creating?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Audience levels */}
      <section className="container max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Three audience levels
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {audienceLevels.map((level) => (
            <div
              key={level.label}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="text-base font-semibold mb-2">{level.label}</div>
              <p className="text-sm text-muted-foreground">{level.description}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-center text-muted-foreground mt-4">
          Switching level re-runs only Layer 2 — Layer 1 detection is cached for speed.
        </p>
      </section>

      {/* Features */}
      <section className="container max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-center mb-3">
          7 outputs no competitor produces for consumers
        </h2>
        <p className="text-center text-muted-foreground mb-10 text-sm">
          Powered by a 3-layer Claude AI pipeline: intelligence → translation →
          adversarial verification.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-muted/30">
        <div className="container max-w-2xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">
            Your contract. Translated in 15 seconds.
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Free. No account. No contract stored. Stateless.
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-base font-semibold px-8 py-3 rounded-md hover:bg-primary/90 transition-colors"
          >
            Analyse a contract
            <ArrowRight className="h-4 w-4" />
          </Link>
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
            Translation tool only. Not legal advice. Consult a qualified attorney
            before signing.
          </p>
        </div>
      </footer>
    </div>
  );
}
