import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/shell/AppShell";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
	display: "swap",
	preload: true,
	fallback: ["system-ui", "arial"],
	adjustFontFallback: true,
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
	display: "swap",
	preload: true,
	fallback: ["monospace"],
	adjustFontFallback: true,
});

export const metadata = {
	title: {
		default: "Agent Society",
		template: "%s · Agent Society",
	},
	description:
		"A persistent society of AI agents that debate, disagree, and decide — each with its own personality and long-term memory.",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
				<AppShell>{children}</AppShell>
			</body>
		</html>
	);
}
