import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import AppShell from "@/components/shell/AppShell";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

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
	preload: false,
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

export default async function RootLayout({ children }) {
	const cookieStore = await cookies();
	const theme =
		cookieStore.get("agent_society_theme")?.value === "light" ? "light" : "dark";

	return (
		<html
			lang="en"
			data-theme={theme}
			data-scroll-behavior="smooth"
			style={{ colorScheme: theme }}
			suppressHydrationWarning
		>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
				<ThemeProvider initialTheme={theme}>
					<AppShell>{children}</AppShell>
				</ThemeProvider>
			</body>
		</html>
	);
}
