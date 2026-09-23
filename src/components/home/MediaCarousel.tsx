import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export type HomeMediaSlide = {
  id: string;
  url: string;
  type: "image" | "video";
  order: number;
  active?: boolean;
};

export function MediaCarousel({ slides }: { slides: HomeMediaSlide[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: slides.length > 1 });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);

  const sync = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    sync();
    emblaApi.on("select", sync);
    return () => { emblaApi.off("select", sync); };
  }, [emblaApi, sync]);

  useEffect(() => {
    if (!emblaApi || paused || slides.length < 2) return;
    const interval = window.setInterval(() => emblaApi.scrollNext(), 6500);
    return () => window.clearInterval(interval);
  }, [emblaApi, paused, slides.length]);

  if (!slides.length) return null;

  return (
    <section className="media-stage" aria-label="El estudio DIEGCUTZ">
      <div className="media-stage__viewport" ref={emblaRef}>
        <div className="media-stage__track">
          {slides.map((slide, index) => (
            <figure className="media-stage__slide" key={slide.id}>
              {slide.type === "video" ? (
                <video src={slide.url} muted loop autoPlay playsInline preload={index === 0 ? "auto" : "metadata"} />
              ) : (
                <img src={slide.url} alt={`DIEGCUTZ, escena ${index + 1}`} loading={index === 0 ? "eager" : "lazy"} />
              )}
              <figcaption><span>{String(index + 1).padStart(2, "0")}</span><strong>Dentro del estudio</strong></figcaption>
            </figure>
          ))}
        </div>
      </div>
      {slides.length > 1 && (
        <div className="media-stage__controls">
          <div className="media-stage__progress" aria-label={`Imagen ${selected + 1} de ${slides.length}`}>
            {slides.map((slide, index) => <button key={slide.id} className={index === selected ? "is-active" : ""} onClick={() => emblaApi?.scrollTo(index)} aria-label={`Ver escena ${index + 1}`} />)}
          </div>
          <div>
            <Button variant="ghost" size="icon" onClick={() => emblaApi?.scrollPrev()} aria-label="Anterior"><ChevronLeft /></Button>
            <Button variant="ghost" size="icon" onClick={() => setPaused(value => !value)} aria-label={paused ? "Reanudar carrusel" : "Pausar carrusel"}>{paused ? <Play /> : <Pause />}</Button>
            <Button variant="ghost" size="icon" onClick={() => emblaApi?.scrollNext()} aria-label="Siguiente"><ChevronRight /></Button>
          </div>
        </div>
      )}
    </section>
  );
}