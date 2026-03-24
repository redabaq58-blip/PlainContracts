"use client";

import { useEffect, useState } from "react";
import { getPowerScoreColor, getPowerScoreLabel } from "@/lib/utils/powerScore";
import { cn } from "@/lib/utils/cn";

interface PowerScoreGaugeProps {
  score: number;
  className?: string;
}

export function PowerScoreGauge({ score, className }: PowerScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);

  // Animate score from 0 to final value
  useEffect(() => {
    if (score === 0) {
      setDisplayScore(0);
      return;
    }
    const startTime = Date.now();
    const duration = 1200;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [score]);

  const cx = 100;
  const cy = 108;
  const r = 80;
  const circumference = 2 * Math.PI * r;
  const halfCirc = Math.PI * r; // 180° arc length
  const filled = (displayScore / 100) * halfCirc;
  const color = getPowerScoreColor(score);
  const label = getPowerScoreLabel(score);

  // Color class for text
  const textColorClass =
    score >= 70
      ? "text-green-600 dark:text-green-400"
      : score >= 40
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className={cn("text-center", className)}>
      <div className="relative mx-auto" style={{ maxWidth: 240 }}>
        <svg
          viewBox="0 0 200 115"
          className="w-full"
          aria-label={`Contract fairness score: ${score} out of 100`}
        >
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            strokeWidth={18}
            strokeLinecap="round"
            strokeDasharray={`${halfCirc} ${circumference}`}
            transform={`rotate(180 ${cx} ${cy})`}
            style={{ stroke: "var(--gauge-track)" }}
          />
          {/* Score arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            strokeWidth={18}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            transform={`rotate(180 ${cx} ${cy})`}
            style={{
              stroke: color,
              transition: "stroke-dasharray 0.05s ease-out",
            }}
          />
          {/* Score number */}
          <text
            x="50%"
            y="84"
            textAnchor="middle"
            fontSize="38"
            fontWeight="700"
            style={{ fill: color, fontFamily: "inherit" }}
          >
            {displayScore}
          </text>
          {/* /100 */}
          <text
            x="50%"
            y="102"
            textAnchor="middle"
            fontSize="11"
            style={{ fill: "hsl(var(--muted-foreground))", fontFamily: "inherit" }}
          >
            / 100
          </text>
        </svg>
      </div>

      <div className="mt-1 space-y-1">
        <p className={cn("text-sm font-semibold", textColorClass)}>{label}</p>
        <p className="text-xs text-muted-foreground">Contract fairness score</p>
      </div>
    </div>
  );
}
