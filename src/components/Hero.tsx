import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import carousel1 from "@/assets/carousel-1.png";
import carousel2 from "@/assets/carousel-2.png";
import carousel3 from "@/assets/carousel-3.png";
import carousel4 from "@/assets/carousel-4.png";

const slides = [
  {
    image: carousel1,
    title: "Nutritious Meals,",
    highlight: "Lovingly Prepared",
    description:
      "Fresh, balanced lunch boxes packed with nutrition — rice, dal, sabzi, roti, fruits & more.",
  },
  {
    image: carousel2,
    title: "Happy Kids,",
    highlight: "Happy Parents",
    description:
      "Watch your children enjoy foods at their school",
  },
  {
    image: carousel3,
    title: "Chef-Crafted,",
    highlight: "Kitchen Fresh",
    description:
      "Professional chefs prepare every meal in our FSSAI-certified, hygienic kitchen daily.",
  },
  {
    image: carousel4,
    title: "On Time,",
    highlight: "Every Day",
    description:
      "Hot meals delivered fresh to your child's school, right before breakfast and lunch — never late.",
  },
];

const AUTOPLAY_INTERVAL = 5000;

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
    },
    [current]
  );

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Autoplay
  useEffect(() => {
    const timer = setInterval(next, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-[hsl(222,40%,10%)]">
      {/* ── Carousel background images ── */}
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={slides[current].image}
            alt={slides[current].title}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlays — always on top of images */}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(222,40%,6%)]/90 via-[hsl(222,40%,8%)]/70 to-transparent z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(222,40%,6%)]/60 via-transparent to-[hsl(222,40%,6%)]/30 z-[1]" />
      <div className="absolute inset-0 bg-[hsl(217,91%,50%)]/8 z-[1]" />
      <div className="absolute inset-0 dot-pattern opacity-15 z-[2] pointer-events-none" />

      {/* ── Content ── */}
      <div className="container mx-auto px-4 py-20 relative z-[3]">
        <div className="max-w-2xl">
          {/* <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-5 py-2.5 mb-8"
          >
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-semibold text-white/90">
              Trusted by 500+ schools across India
            </span>
          </motion.div> */}

          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-extrabold leading-[1.1] text-white text-balance mb-6">
                {slides[current].title}{" "}
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-indigo-400 bg-clip-text text-transparent">
                  {slides[current].highlight}
                </span>
              </h1>

              <p className="text-lg md:text-xl text-white/70 max-w-lg leading-relaxed mb-8">
                {slides[current].description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-4 mb-10"
          >
            <a
              href="#contact"
              className="h-14 px-8 rounded-full bg-primary text-white font-bold hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          {/* Stats row */}
          {/* <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-8"
          >
            {[
              { value: "10K+", label: "Happy Parents" },
              { value: "500+", label: "Schools" },
              { value: "4.9★", label: "Rating" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`${i > 0 ? "border-l border-white/20 pl-8" : ""}`}
              >
                <p className="font-display font-extrabold text-xl text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-white/50">{stat.label}</p>
              </div>
            ))}
          </motion.div> */}
        </div>
      </div>



      {/* ── Dot indicators ── */}
      <div className="absolute bottom-14 md:bottom-12 left-1/2 -translate-x-1/2 z-[4] flex items-center gap-2.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-2.5 rounded-full transition-all duration-400 ${i === current
              ? "w-9 bg-primary shadow-glow"
              : "w-2.5 bg-white/30 hover:bg-white/50"
              }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* ── Bottom wave separator ── */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-[0] z-[3]">
        <svg
          viewBox="0 0 1440 80"
          className="relative block w-full h-[40px] md:h-[50px]"
          preserveAspectRatio="none"
        >
          <path
            d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z"
            className="fill-foreground"
          />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
