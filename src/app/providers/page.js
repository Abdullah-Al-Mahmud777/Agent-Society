"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import the component to avoid SSR/routing issues
const ProvidersContent = dynamic(() => import("./ProvidersContent"), {
  ssr: false,
  loading: () => (
    <main className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-navy-900 text-ink">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.12),_transparent_28%),linear-gradient(180deg,_#0b1526_0%,_#07111f_100%)]" />
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-400" />
          <p className="mt-4 text-sm text-ink-muted">Loading providers...</p>
        </div>
      </div>
    </main>
  ),
});

export default function ProvidersPage() {
  return <ProvidersContent />;
}
