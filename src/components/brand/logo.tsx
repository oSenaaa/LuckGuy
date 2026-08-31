import Link from "next/link";

/**
 * Símbolo LÍDER — duas cruzes arredondadas entrelaçadas (uma carmim, uma cinza),
 * evocando conexão e cuidado. Reprodução vetorial fiel da marca de
 * lidersaude.com.br; se a LÍDER fornecer o SVG oficial, basta trocar os paths.
 */
export function LiderMark({
  className,
  title = "LÍDER",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <mask id="lider-weave" maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
        <rect width="48" height="48" fill="#fff" />
        {/* deixa a cruz cinza passar "por cima" da carmim neste ponto */}
        <rect x="12" y="4" width="13" height="21" rx="6" fill="#000" />
      </mask>

      {/* cruz cinza (atrás), centro ~ (19, 26) */}
      <path
        d="M19 13 V39 M6 26 H32"
        stroke="var(--color-brand-gray, #8a8c8e)"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* cruz carmim (à frente), centro ~ (27, 22), tecida com a cinza */}
      <g mask="url(#lider-weave)">
        <path
          d="M27 9 V35 M14 22 H40"
          stroke="var(--color-brand, #ba0e31)"
          strokeWidth="9"
          strokeLinecap="round"
        />
      </g>
    </svg>
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
