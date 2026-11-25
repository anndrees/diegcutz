import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ClosureState = { active: boolean; reason: string };
type Ctx = ClosureState & { loaded: boolean; modalOpen: boolean; openModal: () => void; closeModal: () => void };

const ClosureContext = createContext<Ctx | null>(null);

export const parseClosure = (value: unknown): ClosureState => {
  const v = (value ?? {}) as { active?: unknown; reason?: unknown };
  return { active: v.active === true, reason: typeof v.reason === "string" ? v.reason : "" };
};

export const isClosureError = (error: { message?: string; hint?: string } | null | undefined) =>
  !!error && (error.hint === "temporary_closure" || (error.message ?? "").includes("DIEGCUTZ_TEMPORARY_CLOSURE"));

export function TemporaryClosureProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClosureState>({ active: false, reason: "" });
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.from("app_settings").select("value").eq("key", "temporary_closure").maybeSingle().then(({ data }) => {
      if (!alive) return;
      const s = parseClosure(data?.value);
      setState(s);
      setModalOpen(s.active); // shown on every visit while closed
      setLoaded(true);
    });
    const channel = supabase
      .channel(`closure-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings", filter: "key=eq.temporary_closure" }, (payload) => {
        const s = parseClosure((payload.new as { value?: unknown } | null)?.value);
        setState(s);
        setModalOpen(s.active);
      })
      .subscribe();
    return () => { alive = false; supabase.removeChannel(channel); };
  }, []);

  // Any link to /booking opens the closure modal instead of navigating.
  useEffect(() => {
    if (!state.active) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin === window.location.origin && url.pathname.startsWith("/booking")) {
        e.preventDefault();
        e.stopPropagation();
        setModalOpen(true);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [state.active]);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  return (
    <ClosureContext.Provider value={{ ...state, loaded, modalOpen, openModal, closeModal }}>
      {children}
    </ClosureContext.Provider>
  );
}

export const useTemporaryClosure = () => {
  const ctx = useContext(ClosureContext);
  if (!ctx) throw new Error("useTemporaryClosure must be used inside TemporaryClosureProvider");
  return ctx;
};
