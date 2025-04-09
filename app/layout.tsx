import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/Navbar";
import { siteConfig } from "@/config/site";
import { ErrorHandler } from "@/components/ErrorHandler";
import { Analytics } from "@vercel/analytics/next";
import Footer from "@/components/Footer";
import { ThemeProvider } from "next-themes";

export const metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/file.png",
    shortcut: "/file.png",
    apple: "/file.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#000000" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />
          <meta
            name="google-adsense-account"
            content="ca-pub-1160650118224185"
          ></meta>
        </head>

        <body className="font-sans bg-transparent">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="mx-auto h-screen">
              <div className="relative flex flex-col  overflow-x-hidden">
                <Navbar />
                <main className="mb-3 mx-auto">{children}</main>
              </div>
              <Toaster />
              <ErrorHandler />
              <Analytics />
              <Footer />
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
