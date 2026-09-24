import Image from "next/image";

export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/logo-casita-solose.png"
      alt="Casita Solosé"
      width={900}
      height={155}
      priority
      className={className}
    />
  );
}
