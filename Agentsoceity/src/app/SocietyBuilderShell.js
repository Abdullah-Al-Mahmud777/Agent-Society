"use client";

import dynamic from "next/dynamic";

const SocietyBuilderApp = dynamic(() => import("../components/society-builder/SocietyBuilderApp"), {
	ssr: false,
	loading: () => (
		<main className="min-h-screen bg-[#07111f] text-white">
			<div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-16">
				<div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
					<div className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/70">Loading society builder</div>
					<h1 className="mt-4 text-3xl font-semibold text-white">Preparing your local society workspace</h1>
					<p className="mt-3 text-sm leading-7 text-white/65">The builder loads only in the browser to avoid hydration mismatches from local storage.</p>
				</div>
			</div>
		</main>
	),
});

export default function SocietyBuilderShell() {
	return <SocietyBuilderApp />;
}
