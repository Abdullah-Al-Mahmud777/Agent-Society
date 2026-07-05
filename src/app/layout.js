import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/shell/AppShell";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
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
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<AppShell>{children}</AppShell>
			</body>
		</html>
	);
}
