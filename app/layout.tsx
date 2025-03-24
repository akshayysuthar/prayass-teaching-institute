import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/Navbar";
import { siteConfig } from "@/config/site";
import { ErrorHandler } from "@/components/ErrorHandler";
import { Analytics } from "@vercel/analytics/next";
import Footer from "@/components/Footer";

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
        </head>
        <body
          style={{
            backgroundColor: siteConfig.theme.background,
            color: siteConfig.theme.text,
          }}
          className="min-h-screen bg-background font-sans antialiased"
        >
          <div className="mx-auto sm:px-1 lg:px-10 max-w-7xl">
            <div className="relative flex min-h-screen flex-col overflow-x-hidden">
              <Navbar />
              <main className="flex-1 ">{children}</main>
            </div>
            <Toaster />
            <ErrorHandler />
            <Analytics />
            <Footer />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
