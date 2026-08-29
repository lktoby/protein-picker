"use client";

import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CarouselApi = UseEmblaCarouselType[1];
type CarouselOptions = NonNullable<Parameters<typeof useEmblaCarousel>[0]>;
type CarouselPlugin = NonNullable<Parameters<typeof useEmblaCarousel>[1]>;

type CarouselContextValue = {
  carouselRef: UseEmblaCarouselType[0];
  api: CarouselApi;
  /** 現在表示中のスライド番号（0 始まり） */
  selectedIndex: number;
  /** スライドの位置一覧。ドット表示の個数に使う */
  scrollSnaps: number[];
  scrollTo: (index: number) => void;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
};

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel は <Carousel> の中で使ってください。");
  }
  return context;
}

function Carousel({
  opts,
  plugins,
  setApi,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  setApi?: (api: CarouselApi) => void;
}) {
  const [carouselRef, api] = useEmblaCarousel(opts, plugins);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const scrollTo = React.useCallback((index: number) => api?.scrollTo(index), [api]);
  const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = React.useCallback(() => api?.scrollNext(), [api]);

  React.useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setSelectedIndex(api.selectedScrollSnap());
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };
    const onInit = () => setScrollSnaps(api.scrollSnapList());

    onInit();
    onSelect();
    api.on("reInit", onInit);
    api.on("reInit", onSelect);
    api.on("select", onSelect);

    return () => {
      api.off("reInit", onInit);
      api.off("reInit", onSelect);
      api.off("select", onSelect);
    };
  }, [api]);

  React.useEffect(() => {
    setApi?.(api);
  }, [api, setApi]);

  // 左右キーでの移動は自前で付ける（embla はドラッグ／スワイプのみ）。
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  const value = React.useMemo<CarouselContextValue>(
    () => ({
      carouselRef,
      api,
      selectedIndex,
      scrollSnaps,
      scrollTo,
      scrollPrev,
      scrollNext,
      canScrollPrev,
      canScrollNext,
    }),
    [
      carouselRef,
      api,
      selectedIndex,
      scrollSnaps,
      scrollTo,
      scrollPrev,
      scrollNext,
      canScrollPrev,
      canScrollNext,
    ],
  );

  return (
    <CarouselContext.Provider value={value}>
      <div
        data-slot="carousel"
        role="region"
        // キーボードで入れるようにフォーカスを受け取り、リングを必ず出す。
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative rounded-card outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef } = useCarousel();

  return (
    <div ref={carouselRef} data-slot="carousel-viewport" className="overflow-hidden">
      <div data-slot="carousel-content" className={cn("flex", className)} {...props} />
    </div>
  );
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="carousel-item"
      role="group"
      aria-roledescription="slide"
      className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
      {...props}
    />
  );
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn("rounded-full", className)}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeft aria-hidden />
      <span className="sr-only">前へ</span>
    </Button>
  );
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn("rounded-full", className)}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ChevronRight aria-hidden />
      <span className="sr-only">次へ</span>
    </Button>
  );
}

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  useCarousel,
  type CarouselApi,
};
