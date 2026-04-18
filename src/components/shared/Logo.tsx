import Link from "next/link";

interface LogoProps {
  href?: string;
  size?: "sm" | "md";
}

export function Logo({ href = "/", size = "md" }: LogoProps) {
  const cls =
    size === "sm"
      ? "font-['Syne'] font-black text-[18px] tracking-[3px] text-[#FF5722]"
      : "font-['Syne'] font-black text-[22px] tracking-[4px] text-[#FF5722]";

  return (
    <Link href={href} className={cls} style={{ userSelect: "none" }}>
      FARfit
    </Link>
  );
}
