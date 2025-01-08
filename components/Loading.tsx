// import { Loader2 } from 'lucide-react'
import Image from "next/image";

export function Loading({ title }: { title: string }) {
  return (
    <div className="flex justify-center items-center h-24">
      <span className="p-2 ">
        <Image
          alt="logo"
          className="animate-pulse p-0 rounded-full"
          src={"/file.png"}
          height={100}
          width={100}
        />
      </span>
      <h2>{title}</h2>

      {/* <Loader2 className="h-8 w-8 animate-spin text-primary" /> */}
    </div>
  );
}
