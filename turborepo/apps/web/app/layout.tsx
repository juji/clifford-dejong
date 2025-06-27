import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import TamaguiProviderClient from "../components/tamagui-provider-client";
import ThemeToggleButton from "../components/theme-toggle-button";
import { ThemeProvider } from "next-themes";

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
        <ThemeProvider
          attribute="class"
          value={{ light: "t_light", dark: "t_dark" }}
          defaultTheme="system"
          enableSystem
        >
          <TamaguiProviderClient>
            <ThemeToggleButton />
            {children}
          </TamaguiProviderClient>
        </ThemeProvider>
      </body>
    </html>
  );
}
