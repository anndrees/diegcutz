import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Copy, Pause, Play, RotateCcw, Scissors, Volume2, VolumeX } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand/BrandMark";
import { finalRank, MODES, TOTAL_CUTS, type CutMode } from "@/components/game/cutBeatRules";
import type { CutStats } from "@/components/game/CutBeatEngine";
import type Phaser from "phaser";
import "./CutBeat.css";

type Status = "idle" | "playing" | "paused" | "finished";
const initialStats: CutStats = { score: 0, combo: 0, bestCombo: 0, perfect: 0, hits: 0, cuts: 0, grade: "", offset: 0 };
const readBest = (mode: CutMode) => { try { return Number(localStorage.getItem(`dc-cut-beat-${mode}`)) || 0; } catch { return 0; } };

export default function CutBeat() {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);
  const statusRef = useRef<Status>("idle");
  const modeRef = useRef<CutMode>("flow");
  const [status, setStatus] = useState<Status>("idle");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<CutMode>("flow");
  const [stats, setStats] = useState<CutStats>(initialStats);
  const [countdown, setCountdown] = useState(0);
  const [muted, setMuted] = useState(false);
  const [best, setBest] = useState(() => readBest("flow"));
  const [newRecord, setNewRecord] = useState(false);
  const [copied, setCopied] = useState(false);
  const reduced = useReducedMotion();

  const changeStatus = useCallback((next: Status) => { statusRef.current = next; setStatus(next); }, []);
  const togglePause = useCallback(() => {
    const current = statusRef.current;
    if (current !== "playing" && current !== "paused") return;
    const paused = current === "playing";
    game.current?.events.emit("pause-round", paused);
    changeStatus(paused ? "paused" : "playing");
  }, [changeStatus]);

  useEffect(() => {
    let disposed = false;
    const originalTitle = document.title;
    document.title = "CUT / BEAT — DIEGCUTZ";
    void import("@/components/game/CutBeatEngine").then(({ createCutBeat }) => {
      if (disposed || !host.current) return;
      game.current = createCutBeat(host.current, {
        mode: "flow", reduced: !!reduced,
        onStats: setStats, onCountdown: setCountdown,
        onEnd: result => {
          const previous = readBest(modeRef.current);
          setNewRecord(result.score > previous);
          if (result.score > previous) {
            try { localStorage.setItem(`dc-cut-beat-${modeRef.current}`, String(result.score)); } catch { /* Private mode still permits play. */ }
          }
          setBest(Math.max(previous, result.score));
          setCountdown(0); changeStatus("finished");
        },
      });
      game.current.events.once("ready", () => setReady(true));
      game.current.events.on("toggle-pause", togglePause);
    }).catch(() => { if (!disposed) setError(true); });
    const onHidden = () => {
      if (document.hidden && statusRef.current === "playing") {
        game.current?.events.emit("pause-round", true); changeStatus("paused");
      }
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => { disposed = true; game.current?.destroy(true); game.current = null; document.title = originalTitle; document.removeEventListener("visibilitychange", onHidden); };
  }, [changeStatus, togglePause, reduced]);

  const start = () => {
    if (!ready) return;
    setCopied(false); setNewRecord(false); setCountdown(3); setStats(initialStats);
    changeStatus("playing"); game.current?.events.emit("start-round", mode);
  };
  const share = async () => {
    const text = `CUT / BEAT · DIEGCUTZ\n${stats.score} puntos · ${finalRank(stats.perfect, stats.hits)}\n${stats.perfect}/${TOTAL_CUTS} cortes perfectos · ${MODES[mode].name}\n${window.location.origin}/cut-beat`;
    try {
      if (navigator.share) await navigator.share({ title: "CUT / BEAT — DIEGCUTZ", text });
      else { await navigator.clipboard.writeText(text); setCopied(true); }
    } catch { /* Dismissing sharing keeps the result. */ }
  };

  return (
    <main className="cut-beat">
      <header className="cb-top">
        <Link to="/" className="cb-brand" aria-label="DIEGCUTZ, inicio"><BrandMark />DIEGCUTZ</Link>
        <div className="cb-top__right">
          <span className="cb-label">PRECISION LAB / 001</span>
          <Button variant="ghost" size="icon" aria-label={muted ? "Activar sonido" : "Silenciar"} title={muted ? "Activar sonido" : "Silenciar"} onClick={() => { setMuted(!muted); game.current?.events.emit("mute-round", !muted); }}>{muted ? <VolumeX /> : <Volume2 />}</Button>
          {(status === "playing" || status === "paused") && <Button variant="ghost" size="icon" aria-label="Pausar partida" title="Pausar partida" onClick={togglePause}><Pause /></Button>}
          <Button asChild variant="ghost" size="icon" title="Volver al inicio"><Link to="/" aria-label="Volver al inicio"><ArrowLeft /></Link></Button>
        </div>
      </header>
      <section className="cb-stage" aria-label="Juego de precisión CUT / BEAT">
        <div className="cb-canvas" ref={host} aria-label="Zona de corte: toca cuando la cuchilla cruce la marca roja" />
        {!ready && <span className="cb-loading">{error ? "No se pudo cargar el juego. Recarga para probar otra vez." : "PREPARANDO LA SILLA…"}</span>}
        {status === "idle" && <>
          <div className="cb-title"><span className="cb-label">EL PULSO. EL CORTE. TÚ.</span><h1>CUT /<span>BEAT</span></h1><p>24 cortes.<br />Un pulso impecable.</p></div>
          <div className="cb-idle-action">
            <div className="cb-modes" aria-label="Ritmo">{(Object.keys(MODES) as CutMode[]).map(key => <Button key={key} variant="ghost" className="cb-mode" aria-pressed={mode === key} onClick={() => { modeRef.current = key; setMode(key); setBest(readBest(key)); }}>{MODES[key].name} · {MODES[key].bpm}</Button>)}</div>
            <Button className="cb-play" disabled={!ready} onClick={start}><Play /> ENTRAR EN RITMO</Button>
            <span className="cb-label">RÉCORD {String(best).padStart(5, "0")}</span>
          </div>
          <span className="cb-edition">MONÓVAR · EST. DIEGCUTZ · PRECISION IS EVERYTHING</span>
        </>}
        {(status === "playing" || status === "paused") && <>
          <div className="cb-hud"><div><small className="cb-label">PUNTOS</small><strong>{String(stats.score).padStart(5, "0")}</strong></div><div><small className="cb-label">COMBO</small><strong>{String(stats.combo).padStart(2, "0")}×</strong></div></div>
          {stats.grade && <div key={stats.cuts} className="cb-grade" data-grade={stats.grade} aria-live="polite"><strong>{stats.grade}</strong><small>{stats.grade === "MISS" ? "RECUPERA EL PULSO" : `${stats.offset > 0 ? "+" : ""}${stats.offset} ms`}</small></div>}
          <Button className="cb-cut" disabled={countdown > 0 || status === "paused"} onClick={() => game.current?.events.emit("cut")}><Scissors /> CORTAR</Button>
        </>}
        {status === "playing" && countdown > 0 && <div className="cb-overlay"><div><span className="cb-label">CUCHILLA AL CENTRO. CORTE AL BEAT.</span><div className="cb-count">{countdown}</div><p>Toca cuando cruce la marca roja.</p></div></div>}
        {status === "paused" && <div className="cb-overlay"><div><span className="cb-label">SIN PRISA. CON PRECISIÓN.</span><h2>EN PAUSA.</h2><Button className="cb-play" onClick={togglePause}><Play /> Continuar</Button></div></div>}
        {status === "finished" && <div className="cb-overlay"><div className="cb-result">
          <span className="cb-label">{MODES[mode].name} / SESIÓN COMPLETADA</span><h2>{finalRank(stats.perfect, stats.hits)}</h2>
          {newRecord && <span className="cb-label cb-record">NUEVO RÉCORD PERSONAL</span>}
          <strong className="cb-result__score">{stats.score}</strong>
          <div className="cb-result__stats"><div><strong>{stats.perfect}/{TOTAL_CUTS}</strong><small className="cb-label">PERFECTOS</small></div><div><strong>{Math.round(stats.hits / TOTAL_CUTS * 100)}%</strong><small className="cb-label">ACIERTO</small></div><div><strong>{stats.bestCombo}×</strong><small className="cb-label">MEJOR COMBO</small></div></div>
          <div className="cb-result__actions"><Button onClick={start}><RotateCcw /> Otra ronda</Button><Button variant="outline" onClick={share}>{copied ? <Check /> : <Copy />}{copied ? "Copiado" : "Compartir"}</Button><Button variant="ghost" onClick={() => changeStatus("idle")}>Cambiar ritmo</Button></div>
        </div></div>}
      </section>
      <footer className="cb-bottom"><span className="cb-label">{status === "idle" ? "TOCA / ESPACIO" : `${String(stats.cuts).padStart(2, "0")} / ${TOTAL_CUTS}`}</span><div className="cb-progress" aria-label={`${stats.cuts} de ${TOTAL_CUTS} cortes`}>{Array.from({ length: TOTAL_CUTS }, (_, i) => <i key={i} className={i < stats.cuts ? "is-done" : ""} />)}</div><span className="cb-label">{MODES[mode].bpm} BPM</span></footer>
    </main>
  );
}