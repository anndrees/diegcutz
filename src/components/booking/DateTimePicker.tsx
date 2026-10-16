import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, addMonths, endOfMonth, format, isSameDay, isSameMonth, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Moon, Sun, Sunset } from "lucide-react";
import "./date-time-picker.css";

type Availability = "full" | "few" | "open" | "closed";

const STATUS_LABEL: Record<Availability, string> = { open: "Libre", few: "Pocas", full: "Lleno", closed: "Cerrado" };

export function DatePickerEditorial({ selected, onSelect, isDisabled, availability, freeCount, maxDate }: {
  selected?: Date;
  onSelect: (d: Date) => void;
  isDisabled: (d: Date) => boolean;
  availability: (d: Date) => Availability;
  freeCount: (d: Date) => number;
  maxDate: Date;
}) {
  const [mode, setMode] = useState<"strip" | "month">("strip");
  const [month, setMonth] = useState(() => startOfMonth(selected ?? new Date()));
  const stripRef = useRef<HTMLDivElement>(null);
  const today = startOfDay(new Date());

  const stripDays = useMemo(() => {
    const out: Date[] = [];
    for (let d = today; d <= maxDate; d = addDays(d, 1)) out.push(d);
    return out;
  }, [maxDate.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfMonth(month);
    const out: Date[] = [];
    for (let d = start; d <= end || out.length % 7; d = addDays(d, 1)) out.push(d);
    return out;
  }, [month]);

  // Anchor the strip so the first bookable day sits second, with the closed day before it visible.
  useEffect(() => {
    if (mode !== "strip" || !stripRef.current) return;
    const first = stripDays.findIndex(d => !isDisabled(d));
    const target = stripRef.current.children[Math.max(0, first - 1)] as HTMLElement | undefined;
    if (target) stripRef.current.scrollLeft = target.offsetLeft - stripRef.current.offsetLeft;
  }, [mode, stripDays.length, stripDays.map(d => (isDisabled(d) ? 0 : 1)).join("")]); // eslint-disable-line react-hooks/exhaustive-deps

  const scroll = (dir: number) => stripRef.current?.scrollBy({ left: dir * stripRef.current.clientWidth * 0.8, behavior: "smooth" });

  const dayBtn = (d: Date, variant: "strip" | "cell") => {
    const disabled = isDisabled(d);
    const av = availability(d);
    const sel = selected && isSameDay(d, selected);
    const free = freeCount(d);
    return (
      <button
        key={d.toISOString()}
        type="button"
        disabled={disabled}
        onClick={() => onSelect(d)}
        className={`dtp-day dtp-day--${variant} is-${disabled && av !== "full" ? "closed" : av} ${sel ? "is-selected" : ""} ${isSameDay(d, today) ? "is-today" : ""} ${variant === "cell" && !isSameMonth(d, month) ? "is-outside" : ""}`}
        aria-pressed={!!sel}
        aria-label={`${format(d, "EEEE d 'de' MMMM", { locale: es })}: ${disabled ? (av === "full" ? "completo" : "no disponible") : `${free} horas libres`}`}
      >
        {variant === "strip" && <small>{format(d, "EEE", { locale: es }).replace(".", "")}</small>}
        <strong>{format(d, "d")}</strong>
        {variant === "strip" && <small>{format(d, "MMM", { locale: es }).replace(".", "")}</small>}
        <i className="dtp-day__dot" aria-hidden="true" />
      </button>
    );
  };

  return (
    <section className="dtp">
      <header className="dtp-head">
        <div>
          <span className="dtp-kicker">01 — Día</span>
          <h3>{selected ? <>{format(selected, "EEEE", { locale: es })} <em>{format(selected, "d 'de' MMMM", { locale: es })}</em></> : <>¿Qué día <em>te viene bien?</em></>}</h3>
        </div>
        <div className="dtp-toggle" role="tablist">
          <button type="button" role="tab" aria-selected={mode === "strip"} className={mode === "strip" ? "is-on" : ""} onClick={() => setMode("strip")}>Próximos días</button>
          <button type="button" role="tab" aria-selected={mode === "month"} className={mode === "month" ? "is-on" : ""} onClick={() => setMode("month")}><CalendarDays /> Mes</button>
        </div>
      </header>

      {mode === "strip" ? (
        <div className="dtp-strip-wrap">
          <button type="button" className="dtp-arrow" onClick={() => scroll(-1)} aria-label="Días anteriores"><ChevronLeft /></button>
          <div className="dtp-strip" ref={stripRef}>{stripDays.map(d => dayBtn(d, "strip"))}</div>
          <button type="button" className="dtp-arrow" onClick={() => scroll(1)} aria-label="Más días"><ChevronRight /></button>
        </div>
      ) : (
        <div className="dtp-month">
          <div className="dtp-month__nav">
            <button type="button" onClick={() => setMonth(m => addMonths(m, -1))} disabled={month <= startOfMonth(today)} aria-label="Mes anterior"><ChevronLeft /></button>
            <strong>{format(month, "MMMM yyyy", { locale: es })}</strong>
            <button type="button" onClick={() => setMonth(m => addMonths(m, 1))} disabled={addMonths(month, 1) > maxDate} aria-label="Mes siguiente"><ChevronRight /></button>
          </div>
          <div className="dtp-month__grid">
            {["L", "M", "X", "J", "V", "S", "D"].map(w => <span key={w} className="dtp-month__wd">{w}</span>)}
            {monthDays.map(d => dayBtn(d, "cell"))}
          </div>
        </div>
      )}

      <footer className="dtp-legend">
        {(["open", "few", "full", "closed"] as Availability[]).map(a => <span key={a} className={`is-${a}`}><i />{STATUS_LABEL[a]}</span>)}
        <span className="dtp-legend__note">Hasta dos meses por adelantado</span>
      </footer>
    </section>
  );
}

export function TimePickerEditorial({ date, slots, available, selected, onSelect }: {
  date: Date;
  slots: number[];
  available: number[];
  selected: string;
  onSelect: (t: string) => void;
}) {
  const groups = [
    { id: "m", label: "Mañana", icon: Sun, test: (m: number) => m < 14 * 60 },
    { id: "t", label: "Tarde", icon: Sunset, test: (m: number) => m >= 14 * 60 && m < 20 * 60 },
    { id: "n", label: "Noche", icon: Moon, test: (m: number) => m >= 20 * 60 },
  ];
  const free = available.length;
  return (
    <section className="dtp">
      <header className="dtp-head">
        <div>
          <span className="dtp-kicker">02 — Hora</span>
          <h3>{selected ? <>A las <em>{selected.slice(0, 5)}</em></> : <>Elige <em>tu hora</em></>}</h3>
        </div>
        <span className={`dtp-count ${free === 0 ? "is-full" : free <= 2 ? "is-few" : ""}`}>
          {slots.length === 0 ? "Cerrado" : free === 0 ? "Día completo" : `${free} ${free === 1 ? "hueco libre" : "huecos libres"}`}
        </span>
      </header>
      <p className="dtp-sub">{format(date, "EEEE d 'de' MMMM", { locale: es })} · sesiones de 1 hora</p>

      {slots.length === 0 ? <p className="dtp-empty">Este día no abrimos. Prueba con otro.</p> : groups.map(g => {
        const list = slots.filter(g.test);
        if (!list.length) return null;
        return (
          <div key={g.id} className="dtp-period">
            <span className="dtp-period__label"><g.icon />{g.label}</span>
            <div className="dtp-times">
              {list.map(m => {
                const hh = String(Math.floor(m / 60)).padStart(2, "0");
                const mm = String(m % 60).padStart(2, "0");
                const t = `${hh}:${mm}:00`;
                const ok = available.includes(m);
                const sel = selected === t;
                return (
                  <button key={m} type="button" disabled={!ok} onClick={() => onSelect(t)} aria-pressed={sel}
                    className={`dtp-time ${sel ? "is-selected" : ""} ${ok ? "" : "is-taken"}`}
                    aria-label={`${hh}:${mm}${ok ? "" : ", ocupada"}`}>
                    <strong>{hh}<span>:{mm}</span></strong>
                    <small>{ok ? (sel ? "Tuya" : "Libre") : "Ocupada"}</small>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {free === 0 && slots.length > 0 && <p className="dtp-empty">Hoy está todo cogido. Elige otro día arriba.</p>}
    </section>
  );
}
