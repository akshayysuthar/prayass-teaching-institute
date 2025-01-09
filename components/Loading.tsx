import Image from "next/image";

export function Loading({ title }: { title: string }) {
  return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)]">
      <span className="p-2">
        <Image
          alt="logo"
          className="animate-pulse p-0 rounded-full"
          src="/file.png"
          height={100}
          width={100}
        />
      </span>
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
    </div>
  );
}
