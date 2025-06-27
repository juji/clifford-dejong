import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { NextTamaguiProvider } from "../components/next-tamagui-provider";
import ThemeToggleButton from "../components/theme-toggle-button";

const inter = Inter({ subsets: ["latin"] });
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Clifford-de Jong Attractor Wallpaper Creator",
  description:
    "A cross-platform app for generating beautiful mathematical art wallpapers using Clifford and de Jong attractors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${robotoMono.variable}`}>
        <NextTamaguiProvider>
          <ThemeToggleButton />
          {children}
        </NextTamaguiProvider>
      </body>
    </html>
  );
}
