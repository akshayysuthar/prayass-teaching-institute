import Image from "next/image";
import { useEffect, useState } from "react";

export function Loading({ title }: { title: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => setShow(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="flex flex-col justify-center items-center h-screen animate-fade-in-out bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-500">
      <span className="p-2">
        <Image
          alt="logo"
          className="animate-pulse p-0 rounded-full"
          src="/file.png"
          height={100}
          width={100}
        />
      </span>
      {/* Modern spinner */}
      <div className="relative flex justify-center items-center mt-4 mb-2">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute w-6 h-6 bg-blue-200 rounded-full animate-ping"></div>
      </div>
      <h2 className="mt-2 text-xl font-semibold text-blue-700 dark:text-blue-200 animate-fade-in">
        {title}
      </h2>
      <style jsx>{`
        .animate-fade-in-out {
          animation: fadeInOut 2s;
        }
        @keyframes fadeInOut {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-fade-in {
          animation: fadeIn 1s;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
