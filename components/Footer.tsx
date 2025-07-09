"use client";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { Mail, Phone, MapPin, Code, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Footer() {
  const [commitMessage, setCommitMessage] = useState<string | null>(null);

  async function fetchLatestCommitMessage(): Promise<string | null> {
    try {
      const res = await fetch(
        "https://api.github.com/repos/akshayysuthar/prayass-teaching-institute/commits/master",
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
          },
          next: { revalidate: 60 * 5 }, // if using Next.js App Router (optional caching)
        }
      );

      if (!res.ok) {
        console.error("Failed to fetch commit:", res.statusText);
        return null;
      }

      const data = await res.json();
      return data.commit?.message || null;
    } catch (err) {
      console.error("GitHub fetch error:", err);
      return null;
    }
  }

  useEffect(() => {
    fetchLatestCommitMessage().then(setCommitMessage);
  }, []);
  return (
    <>
      <div className="w-full h-1 pb-48" /> {/* Trigger Point */}
      <footer className="bg-primary-foreground dark:bg-slate-900 text-foreground dark:text-slate-200 py-8 border-t mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Site Details */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src={siteConfig.mainLogo || "/placeholder.svg"}
                  alt={siteConfig.name}
                  width={40}
                  height={40}
                  className="bg-background dark:bg-slate-800 p-1 rounded-md"
                />
                <h3 className="text-xl font-semibold text-primary dark:text-primary-foreground">
                  {siteConfig.name}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {siteConfig.description}
              </p>
            </div>

            {/* App Info */}
            <div>
              <h3 className="text-xl font-semibold text-primary dark:text-primary-foreground mb-4">
                App Info
              </h3>
              <p className="text-sm text-muted-foreground">
                Version: {commitMessage || "Loading..."}
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link
                  href="https://github.com/akshayysuthar/prayass-teaching-institute/tree/master"
                  target="_blank"
                >
                  <Github className="mr-2 h-4 w-4" /> View on GitHub
                </Link>
              </Button>
            </div>

            {/* Contact Details */}
            <div>
              <h3 className="text-xl font-semibold text-primary dark:text-primary-foreground mb-4">
                Contact Us
              </h3>
              <p className="text-sm text-muted-foreground flex items-center mb-2">
                <Mail className="mr-2 h-4 w-4" />{" "}
                <Link
                  href={`mailto:${siteConfig.contactInfo.email}`}
                  className="hover:text-primary dark:hover:text-primary-foreground transition-colors"
                >
                  {siteConfig.contactInfo.email}
                </Link>
              </p>
              <p className="text-sm text-muted-foreground flex items-center mb-2">
                <Phone className="mr-2 h-4 w-4" />{" "}
                <Link
                  href={`tel:${siteConfig.contactInfo.phone}`}
                  className="hover:text-primary dark:hover:text-primary-foreground transition-colors"
                >
                  {siteConfig.contactInfo.phone}
                </Link>
              </p>
              <p className="text-sm text-muted-foreground flex items-center mb-2">
                <MapPin className="mr-2 h-4 w-4" />{" "}
                {siteConfig.contactInfo.address}
              </p>
              <p className="text-sm text-muted-foreground flex items-center">
                <Code className="mr-2 h-4 w-4" /> Developed by{" "}
                <Link
                  href="https://portfolio-main-zeta-two.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-primary dark:text-primary-foreground hover:underline transition-colors flex items-center"
                >
                  Akshay Suthar <ExternalLink className="ml-1 h-4 w-4" />
                </Link>
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {siteConfig.name}. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
