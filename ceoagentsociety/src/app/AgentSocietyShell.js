"use client";

import dynamic from "next/dynamic";

const AgentSocietyClient = dynamic(() => import("./AgentSocietyClient"), {
	ssr: false,
});

export default function AgentSocietyShell() {
	return <AgentSocietyClient />;
}