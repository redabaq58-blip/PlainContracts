import Link from "next/link";
import { FileText } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="container max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground hover:opacity-80 transition-opacity"
        >
          <FileText className="h-5 w-5 text-primary" />
          <span>PlainContracts</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/analyze"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
          >
            Analyze
          </Link>
          <Link
            href="/generate"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
          >
            Generate
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
