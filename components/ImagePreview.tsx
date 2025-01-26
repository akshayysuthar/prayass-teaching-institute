import React from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface ImagePreviewProps {
  src: string;
  alt: string;
  onRemove: () => void;
}

export function ImagePreview({ src, alt, onRemove }: ImagePreviewProps) {
  return (
    <div className="relative group">
      <div className="relative w-[200px] h-[100px] md:w-[150px] md:h-[200px] transition-transform duration-200 ease-in-out hover:scale-105">
        <Image
          src={src || "/placeholder.svg"}
          alt={alt}
          layout="fill"
          objectFit="contain"
          className="rounded-lg"
        />
        <button
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
