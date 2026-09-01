import Image from "next/image";
import Link from "next/link";

export function LiderMark({
  className = "size-9",
  title = "LÍDER",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <Image
      src="/lider-mark.png"
      alt={title}
      width={512}
      height={506}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}

type LogoProps = {
  variant?: "full" | "mark";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
};

const MARK_SIZE: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-12 w-12",
};

const WORDMARK_SIZE: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-3xl",
};

export function LiderLogo({
  variant = "full",
  size = "md",
  href,
  className = "",
}: LogoProps) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LiderMark className={MARK_SIZE[size]} />
      {variant === "full" && (
        <span className="flex flex-col leading-none">
          <span
            className={`font-semibold tracking-tight text-brand ${WORDMARK_SIZE[size]}`}
          >
            LÍDER
          </span>
          <span className="mt-0.5 text-[0.62em] font-medium uppercase tracking-[0.28em] text-brand-gray">
            Treinamentos
          </span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label="LÍDER Treinamentos" className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}
