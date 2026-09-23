import type { ReactNode } from "react";
import { CustomerHeader } from "./CustomerHeader";
import { CustomerFooter } from "./CustomerFooter";
import { cn } from "@/lib/utils";

export function CustomerPage({ children, className, footer = true }: { children: ReactNode; className?: string; footer?: boolean }) {
  return (
    <div className={cn("customer-shell customer-page min-h-screen", className)}>
      <CustomerHeader />
      <main className="customer-page__content">{children}</main>
      {footer && <CustomerFooter />}
    </div>
  );
}