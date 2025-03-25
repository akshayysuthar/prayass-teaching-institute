"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import { fetchLastCommit } from "@/lib/github";
import {
  Github,
  Mail,
  MapPin,
  Code,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <footer className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Site Details */}
          <div>
            <h3 className="text-xl font-semibold text-indigo-200 mb-4">
              {siteConfig.name}
            </h3>
            <p className="text-sm text-indigo-100 mb-4">
              {siteConfig.description}
            </p>
            <div className="flex flex-wrap gap-4">
              {siteConfig.footerLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className="text-sm text-indigo-200 hover:text-white transition-colors flex items-center"
                >
                  {link.title} <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* App Info */}
          <div>
            <h3 className="text-xl font-semibold text-indigo-200 mb-4">
              App Info
            </h3>
            <p className="text-sm text-indigo-100">Version: {version}</p>
            {lastCommit ? (
              <p className="text-sm text-indigo-100 mt-2">
                Last Commit:{" "}
                <Link
                  href={`https://github.com/akshayysuthar/prayass-teaching-institute/commit/${lastCommit.sha}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-200 hover:text-white transition-colors flex items-center"
                >
                  {lastCommit.sha.slice(0, 7)}{" "}
                  <ExternalLink className="ml-1 h-4 w-4" />
                  <span className="ml-1">
                    on {new Date(lastCommit.date).toLocaleDateString()}
                  </span>
                </Link>
              </p>
            ) : (
              <p className="text-sm text-indigo-100 mt-2">
                Fetching commit info...
              </p>
            )}
            <Button
              asChild
              variant="outline"
              className="mt-4 border-indigo-200 text-indigo-100 hover:bg-indigo-700 hover:text-white"
            >
              <Link
                href="https://github.com/akshayysuthar/prayass-teaching-institute"
                target="_blank"
              >
                <Github className="mr-2 h-4 w-4" /> View on GitHub
              </Link>
            </Button>
          </div>

          {/* Developer Details */}
          <div>
            <h3 className="text-xl font-semibold text-indigo-200 mb-4">
              Contact Us
            </h3>
            <p className="text-sm text-indigo-100 flex items-center mb-2">
              <Mail className="mr-2 h-4 w-4" />{" "}
              <Link
                href="mailto:akshay@example.com"
                className="hover:text-white transition-colors"
              >
                akshayysuthar@gmail.com
              </Link>
            </p>
            <p className="text-sm text-indigo-100 flex items-center mb-2">
              <MapPin className="mr-2 h-4 w-4" /> Surat, India
            </p>
            <p className="text-sm text-indigo-100 flex items-center">
              <Code className="mr-2 h-4 w-4" /> Developed by{" "}
              <Link
                href="https://portfolio-main-zeta-two.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-indigo-200 hover:text-white transition-colors flex items-center"
              >
                Akshay Suthar <ExternalLink className="ml-1 h-4 w-4" />
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-indigo-400 text-center">
          <p className="text-xs text-indigo-100">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="mt-2 flex justify-center gap-4">
            <Link
              href="/privacy"
              className="text-sm text-indigo-200 hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-indigo-200 hover:text-white"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
