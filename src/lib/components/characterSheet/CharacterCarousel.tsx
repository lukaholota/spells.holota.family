"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PersWithRelations } from "@/lib/actions/pers";
import MainStatsSlide from "./slides/MainStatsSlide";
import SkillsSlide from "./slides/SkillsSlide";
import CombatSlide from "./slides/CombatSlide";
import MagicSlide from "./slides/MagicSlide";
import FeaturesSlide from "./slides/FeaturesSlide";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CharacterFeaturesGroupedResult } from "@/lib/actions/pers";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

interface CharacterCarouselProps {
  pers: PersWithRelations;
  onPersUpdate: (next: PersWithRelations) => void;
  groupedFeatures: CharacterFeaturesGroupedResult | null;
  isReadOnly?: boolean;
}

export default function CharacterCarousel({ pers, onPersUpdate, groupedFeatures, isReadOnly }: CharacterCarouselProps) {
  const swiperRef = useRef<SwiperType | null>(null);

  type SlideId = "stats" | "skills" | "equipment" | "magic" | "features";
  type SlideDef = { id: SlideId; label: string };

  const allSlides: SlideDef[] = useMemo(
    () => [
      { id: "stats", label: "Головна" },
      { id: "skills", label: "Навички" },
      { id: "equipment", label: "Спорядження" },
      { id: "magic", label: "Магія" },
      { id: "features", label: "Фічі" },
    ],
    []
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (swiperRef.current) {
      const isLg = window.matchMedia("(min-width: 1024px)").matches;
      if (isLg) {
        swiperRef.current.slideToLoop(4, 0);
        setCurrentIndex(4);
      } else {
        const isMd = window.matchMedia("(min-width: 768px)").matches;
        if (isMd) {
          swiperRef.current.slideToLoop(0, 0);
          setCurrentIndex(0);
        }
      }
    }
  }, []);

  const renderSlide = (id: SlideId) => {
    if (id === "stats") return <MainStatsSlide pers={pers} onPersUpdate={onPersUpdate} isReadOnly={isReadOnly} />;
    if (id === "skills") return <SkillsSlide pers={pers} onPersUpdate={onPersUpdate} isReadOnly={isReadOnly} />;
    if (id === "equipment") return <CombatSlide pers={pers} onPersUpdate={onPersUpdate} isReadOnly={isReadOnly} />;
    if (id === "magic") return <MagicSlide pers={pers} onPersUpdate={onPersUpdate} isReadOnly={isReadOnly} />;
    if (id === "features") return <FeaturesSlide pers={pers} onPersUpdate={onPersUpdate} groupedFeatures={groupedFeatures} isReadOnly={isReadOnly} />;
    return null;
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Content */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div className="h-full min-h-0 px-3 pt-3 pb-2 md:px-4 md:pt-4 md:absolute md:inset-0">
          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            modules={[Navigation]}
            navigation={{
              prevEl: ".swiper-button-prev-custom",
              nextEl: ".swiper-button-next-custom",
            }}
            onSlideChange={(swiper) => {
              if (currentIndex !== swiper.realIndex) {
                setCurrentIndex(swiper.realIndex);
              }
            }}
            loop={true}
            speed={400}
            touchRatio={1.2}
            grabCursor={true}
            watchSlidesProgress={true}
            slidesPerView={1}
            spaceBetween={12}
            breakpoints={{
              768: {
                slidesPerView: 2,
                spaceBetween: 16,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 16,
              },
            }}
            className="h-full w-full"
          >
            {allSlides.map((slide) => (
              <SwiperSlide key={slide.id} className="h-full">
                <div className="bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl shadow-black/30 h-full min-h-0 overflow-hidden">
                  <div className="h-full md:pb-0 pb-24 min-h-0 overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
                    {renderSlide(slide.id)}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Side navigation arrows (all breakpoints) using Swiper Navigation */}
          <Button
            className="swiper-button-prev-custom fixed left-2 md:left-28 top-1/2 -translate-y-1/2 bg-slate-900/90 hover:bg-slate-800/95 backdrop-blur-sm border border-white/20 text-white rounded-full w-10 h-10 md:w-12 md:h-12 p-0 shadow-xl z-10 disabled:opacity-0"
            size="icon"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
          <Button
            className="swiper-button-next-custom fixed right-2 md:right-6 top-1/2 -translate-y-1/2 bg-slate-900/90 hover:bg-slate-800/95 backdrop-blur-sm border border-white/20 text-white rounded-full w-10 h-10 md:w-12 md:h-12 p-0 shadow-xl z-10 disabled:opacity-0"
            size="icon"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
        </div>
      </div>

      {/* Bottom navigation (always visible) */}
      <div className="fixed bottom-[75px] left-0 w-full md:sticky md:bottom-0 z-20 border-t border-white/10 bg-slate-900/95 backdrop-blur-xl px-2 py-2 shadow-xl shadow-black/30">
        <div className="mx-auto max-w-5xl flex items-center justify-center gap-1">
          {allSlides.map((s, idx) => {
            const active = idx === currentIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  swiperRef.current?.slideToLoop(idx);
                }}
                className={
                  "px-2 py-1 rounded-md text-[10px] sm:text-xs transition border " +
                  (active
                    ? "bg-indigo-500/20 border-indigo-400/40 text-indigo-100"
                    : "bg-white/5 border-white/10 text-slate-200/80 hover:bg-white/10")
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
