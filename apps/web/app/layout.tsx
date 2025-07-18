import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Chaos Canvas",
  description:
    "A cross-platform app for generating beautiful mathematical art wallpapers using Clifford and de Jong attractors.",
  applicationName: "Chaos Canvas",
  manifest: "/manifest.webmanifest", // Next.js will serve this from /app/manifest.ts
  metadataBase: new URL("https://clifford-dejong.vercel.app/"), // Set to your canonical URL
  icons: [
    { rel: "icon", url: "/icons/icon-192x192.png", sizes: "192x192" },
    { rel: "icon", url: "/icons/icon-512x512.png", sizes: "512x512" },
    {
      rel: "apple-touch-icon",
      url: "/icons/apple-touch-icon.png",
      sizes: "180x180",
    },
    { rel: "mask-icon", url: "/icons/safari-pinned-tab.svg", color: "#18181b" },
  ],
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  appleWebApp: {
    capable: true,
    title: "Chaos Canvas",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Chaos Canvas",
    description:
      "A cross-platform app for generating beautiful mathematical art wallpapers using Clifford and de Jong attractors.",
    url: "https://clifford-dejong.example.com/", // Update to your canonical URL
    siteName: "Chaos Canvas",
    images: [
      {
        url: "/og-image.png", // Use the image in the public directory
        width: 1200,
        height: 630,
        alt: "Chaos Canvas Open Graph Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chaos Canvas",
    description:
      "A cross-platform app for generating beautiful mathematical art wallpapers using Clifford and de Jong attractors.",
    images: ["/og-image.png"],
    creator: "@your_twitter_handle", // Update as needed
  },
};

export const viewport: Viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
