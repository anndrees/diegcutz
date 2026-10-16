import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function usePaged<T>(items: T[], pageSize: number, resetKey?: unknown) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => { setPage(1); }, [resetKey]);
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);
  const slice = items.slice((page - 1) * pageSize, page * pageSize);
  return { page, pages, setPage, slice, total: items.length };
}

export function ListPager({ page, pages, total, setPage }: { page: number; pages: number; total: number; setPage: (p: number) => void }) {
  if (pages <= 1) return null;
  const go = (p: number) => { setPage(p); };
  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => go(page - 1)} aria-label="Página anterior">
        <ChevronLeft className="h-4 w-4" /> Anterior
      </Button>
      <span className="text-xs text-muted-foreground tabular-nums">
        Página {page} de {pages} · {total}
      </span>
      <Button variant="outline" size="sm" disabled={page === pages} onClick={() => go(page + 1)} aria-label="Página siguiente">
        Siguiente <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
