/**
 * Hydration-Safe Output System Wrapper
 * 
 * This wrapper ensures proper hydration handling for the output system.
 * Use this wrapper instead of directly importing OutputToolbar if you
 * encounter hydration issues.
 */

"use client";

import { useEffect, useState } from "react";
import OutputToolbar from "./OutputToolbar";
import ContentEditor from "./ContentEditor";

export default function OutputSystemWrapper({ agents = [] }) {
	const [isMounted, setIsMounted] = useState(false);

	// Ensure component only renders after hydration
	useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return null;
	}

	return (
		<>
			<OutputToolbar agents={agents} />
			<ContentEditor />
		</>
	);
}

/**
 * USAGE:
 * 
 * Instead of:
 *   import OutputToolbar from "@/components/output/OutputToolbar";
 *   <OutputToolbar agents={agents} />
 * 
 * Use:
 *   import OutputSystemWrapper from "@/components/output/OutputSystemWrapper";
 *   <OutputSystemWrapper agents={agents} />
 * 
 * This ensures the output system only renders after hydration completes,
 * preventing any server/client mismatch errors.
 */
