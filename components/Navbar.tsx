"use client";

import Link from "next/link";
import Image from "next/image";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  // SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { Menu } from "lucide-react";
import { DialogTitle } from "./ui/dialog";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin =
    user?.emailAddresses[0]?.emailAddress &&
    siteConfig.adminEmail.includes(user.emailAddresses[0].emailAddress);
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
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                      pathname === item.href
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
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
              <DialogTitle className="font-bold text-2xl">
                {siteConfig.name}
              </DialogTitle>
              <MobileNav setOpen={setOpen} />
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/file.png" alt="Logo" width={24} height={24} />
            <span className="font-bold text-lg">{siteConfig.name}</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
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

function MobileNav({ setOpen }: { setOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin =
    user?.emailAddresses[0]?.emailAddress &&
    siteConfig.adminEmail.includes(user.emailAddresses[0].emailAddress);

  return (
    <ScrollArea className="my-2 h-[calc(100vh-8rem)] pb-10 pl-1">
      <div className="flex flex-col space-y-4">
        {siteConfig.navLinks.map(
          (item) =>
            (!item.adminOnly || (item.adminOnly && isAdmin)) && (
              <MobileLink
                key={item.href}
                href={item.href}
                pathname={pathname}
                onClick={() => setOpen(false)}
                icon={item.icon}
              >
                {item.title}
              </MobileLink>
            )
        )}
      </div>
      {!user && (
        <div className="mt-6 px-6">
          <SignInButton mode="modal">
            <Button className="w-full">Sign In</Button>
          </SignInButton>
        </div>
      )}
    </ScrollArea>
  );
}

interface MobileLinkProps {
  href: string;
  pathname: string;
  children: React.ReactNode;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
}

function MobileLink({
  href,
  pathname,
  children,
  onClick,
  icon: Icon,
}: MobileLinkProps) {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 text-foreground/70 transition-colors hover:text-foreground",
        isActive && "text-foreground font-semibold"
      )}
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      {children}
    </Link>
  );
}
