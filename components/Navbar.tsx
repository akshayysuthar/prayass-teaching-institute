"use client";

import Link from "next/link";
import Image from "next/image";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import {
  Menu,
  Home,
  Plus,
  FileText,
  Book,
  Settings,
  AlertCircle,
} from "lucide-react";

const icons = {
  home: Home,
  plus: Plus,
  file: FileText,
  book: Book,
  settings: Settings,
  alertCircle: AlertCircle,
};

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin =
    user?.emailAddresses[0]?.emailAddress === "akshaysuthar05@gmail.com";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image src="/file.png" alt="Logo" width={32} height={32} />
            <motion.span
              className="hidden font-bold sm:inline-block"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {siteConfig.name}
            </motion.span>
          </Link>
          <nav className="hidden md:flex items-center space-x-4">
            {siteConfig.navLinks.map(
              (item) =>
                (!item.adminOnly || (item.adminOnly && isAdmin)) && (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      pathname === item.href
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.title}
                  </Link>
                )
            )}
          </nav>
        </div>

        <div className="flex md:hidden items-center">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <MobileNav />
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/file.png" alt="Logo" width={24} height={24} />
            <span className="font-bold text-sm">{siteConfig.name}</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.fullName}
                </span>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <SignInButton mode="modal">
                <Button variant="outline">Sign In</Button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin =
    user?.emailAddresses[0]?.emailAddress &&
    siteConfig.adminEmail.includes(user.emailAddresses[0].emailAddress);

  return (
    <>
      {/* <MobileLink href="/" pathname={pathname} className="flex items-center">
        <Image src="/file.png" alt="Logo" width={32} height={32} />
        <span className="font-bold">{siteConfig.name}</span>
      </MobileLink> */}
      <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
        <div className="flex flex-col space-y-3">
          {siteConfig.navLinks.map(
            (item) =>
              (!item.adminOnly || (item.adminOnly && isAdmin)) && (
                <MobileLink
                  key={item.href}
                  href={item.href}
                  pathname={pathname}
                  className={cn(
                    "text-foreground/70 transition-colors hover:text-foreground",
                    pathname === item.href && "text-foreground"
                  )}
                >
                  {item.title}
                </MobileLink>
              )
          )}
        </div>
      </ScrollArea>
      {!user && (
        <div className="mt-4 px-6">
          <SignInButton mode="modal">
            <Button className="w-full">Sign In</Button>
          </SignInButton>
        </div>
      )}
    </>
  );
}

interface MobileLinkProps {
  href: string;
  pathname: string;
  children: React.ReactNode;
  className?: string;
}

function MobileLink({ href, pathname, children }: MobileLinkProps) {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "text-foreground/70 transition-colors hover:text-foreground",
        isActive && "text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
