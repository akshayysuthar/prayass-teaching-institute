"use client";

import { siteConfig } from "@/config/site";
import Link from "next/link";
import { fetchLastCommit } from "@/lib/github";
import { useEffect, useState } from "react";

export default function Footer() {
  const [lastCommit, setLastCommit] = useState<{
    sha: string;
    date: string;
  } | null>(null);
  const version = "1.0.0";

  useEffect(() => {
    const getLastCommit = async () => {
      try {
        const commit = await fetchLastCommit(
          "akshayysuthar",
          "prayass-teaching-institute"
        );
        setLastCommit(commit);
      } catch (error) {
        console.error("Failed to fetch last commit:", error);
      }
    };
    getLastCommit();
  }, []);

  return (
    <footer
      style={{
        background: `linear-gradient(to top, ${siteConfig.theme.secondary}, ${siteConfig.theme.accent})`, // tea_green to buff
        color: siteConfig.theme.text, // buff-100
      }}
      className="py-8 text-white"
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Site Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{siteConfig.name}</h3>
            <p className="text-sm">{siteConfig.description}</p>
            <div className="flex flex-wrap gap-4">
              {siteConfig.footerLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className="text-sm hover:underline"
                >
                  {link.title}
                </Link>
              ))}
            </div>
          </div>

          {/* App Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">App Info</h3>
            <p className="text-sm">Version: {version}</p>
            {lastCommit ? (
              <p className="text-sm">
                Last Commit:{" "}
                <Link
                  href={`https://github.com/akshayysuthar/prayass-teaching-institute/commit/${lastCommit.sha}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {lastCommit.sha.slice(0, 7)}
                </Link>{" "}
                on {new Date(lastCommit.date).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-sm">Fetching commit info...</p>
            )}
          </div>

          {/* Developer Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Developed By</h3>
            <p className="text-sm">
              <Link
                href="https://portfolio-main-zeta-two.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Akshay Suthar
              </Link>
            </p>
            <p className="text-sm">Surat, India</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="mt-8 border-t pt-4 text-center"
          style={{ borderColor: siteConfig.theme.accent }} // buff
        >
          <p className="text-xs">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
