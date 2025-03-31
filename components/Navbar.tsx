"use client";

import Link from "next/link";
import Image from "next/image";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { Menu } from "lucide-react";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin =
    user?.emailAddresses[0]?.emailAddress &&
    siteConfig.adminEmail.includes(user.emailAddresses[0].emailAddress);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                className="px-0 text-black hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0 bg-white">
              <SheetTitle></SheetTitle>
              <div className="flex items-center gap-2 mb-8">
                <Image src="/file.png" alt="Logo" width={32} height={32} />
                <span className="font-bold text-xl text-blue-600">
                  {siteConfig.name}
                </span>
              </div>
              <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
                <div className="flex flex-col gap-6">
                  {siteConfig.navLinks.map((link) => {
                    // Skip admin-only links for non-admin users
                    if (link.adminOnly && !isAdmin) return null;
                    // Skip disabled links
                    if (link.disabled) return null;

                    const Icon = link.icon;

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "flex items-center gap-2 text-base font-medium transition-colors",
                          pathname === link.href
                            ? "text-blue-600"
                            : "text-black hover:text-blue-600"
                        )}
                        onClick={() => setOpen(false)}
                      >
                        {Icon && <Icon className="h-5 w-5" />}
                        {link.title}
                      </Link>
                    );
                  })}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/file.png" alt="Logo" width={32} height={32} />
            <span className="hidden md:inline-block font-bold text-xl text-blue-600">
              {siteConfig.name}
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          {siteConfig.navLinks.map((link) => {
            // Skip admin-only links for non-admin users
            if (link.adminOnly && !isAdmin) return null;
            // Skip disabled links
            if (link.disabled) return null;

            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 text-base font-medium transition-colors",
                  pathname === link.href
                    ? "text-blue-600"
                    : "text-black hover:text-blue-600"
                )}
              >
                {Icon && <Icon className="h-5 w-5" />}
                {link.title}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm hidden md:inline text-black">
                {user.fullName}
              </span>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <SignInButton mode="modal">
              <Button
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Sign In
              </Button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
