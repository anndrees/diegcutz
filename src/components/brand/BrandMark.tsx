import { cn } from "@/lib/utils";
import logoInk from "@/assets/logo-dc-a.png";
import logoLight from "@/assets/logo-dc-light.png";

type BrandMarkProps = {
  /** "ink" for light (paper) surfaces, "light" for dark surfaces. */
  variant?: "ink" | "light";
  className?: string;
};

export function BrandMark({ variant = "ink", className }: BrandMarkProps) {
  return (
    <img
      src={variant === "light" ? logoLight : logoInk}
      alt=""
      aria-hidden="true"
      loading="lazy"
      width={516}
      height={480}
      className={cn("brand-lockup__mark brand-lockup__mark--img", className)}
    />
  );
}
