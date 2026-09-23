import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppUrl } from "@/lib/phone";

export function WhatsAppButton({ phone, message, compact = true }: { phone?: string | null; message?: string; compact?: boolean }) {
  const href = buildWhatsAppUrl(phone, message);
  if (!href) return null;
  return <Button asChild variant="outline" size={compact ? "icon" : "sm"} title="Contactar por WhatsApp" className="text-success border-success/30 hover:bg-success/10">
    <a href={href} target="_blank" rel="noopener noreferrer"><MessageCircle />{!compact && <span>WhatsApp</span>}</a>
  </Button>;
}
