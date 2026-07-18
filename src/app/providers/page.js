"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import the component to avoid SSR/routing issues
const ProvidersContent = dynamic(() => import("./ProvidersContent"), {
  ssr: false,
  loading: () => (
    <main className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-neutral-950 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.15),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.12),_transparent_28%),linear-gradient(180deg,_#09090b_0%,_#0a0a0b_100%)]" />
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-400" />
          <p className="mt-4 text-sm text-neutral-400">Loading providers...</p>
        </div>
      </div>
    </main>
  ),
});

export default function ProvidersPage() {
  return <ProvidersContent />;
}
