import { useState } from "react";
import { ArrowUpRight, ChevronDown, Gamepad2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import "./footer-extras.css";

export function FooterGames() {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="footer-games hidden lg:block">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="footer-games__trigger"><Gamepad2 /> Juegos <ChevronDown className={open ? "rotate-180" : ""} /></Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="footer-games__links">
        <Link to="/paradox-run">PARADOX RUN <ArrowUpRight /></Link>
        <Link to="/tilt-fade">TILT &amp; FADE · Pinball <ArrowUpRight /></Link>
      </CollapsibleContent>
    </Collapsible>
  );
}