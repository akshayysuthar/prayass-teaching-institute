import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/Navbar";
import { siteConfig } from "@/config/site";
import { ErrorHandler } from "@/components/ErrorHandler";
import { Analytics } from "@vercel/analytics/next";

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
  // icons: {
  //   icon: "/file.png",
  //   shortcut: "/favicon-16x16.png",
  //   apple: "/apple-touch-icon.png",
  // },
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
        <body className="min-h-screen container lg:px-10 px-4 mx-auto bg-background font-sans antialiased">
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
          <ErrorHandler />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
