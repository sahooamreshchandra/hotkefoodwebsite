import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import logo from "../assets/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy: observe each section and track which is in view
  useEffect(() => {
    const sectionIds = ["how-it-works", "contact"];
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const links = [
    { label: "How It Works", href: "/#how-it-works", id: "how-it-works" },
    { label: "Contact", href: "/#contact", id: "contact" },
  ];

  const isActive = (id: string) => {
    if (id === "order") return window.location.pathname === "/order";
    return activeSection === id && window.location.pathname === "/";
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${scrolled
        ? "bg-background/80 backdrop-blur-2xl shadow-soft border-b border-border/40 py-1"
        : "bg-transparent py-2"
        }`}
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-glow overflow-hidden">
            <img src={logo} alt="hotkefood logo" className="h-10 w-10 object-contain" />
          </div>
          <span className={`font-display font-bold text-xl transition-colors duration-300 ${scrolled ? "text-foreground" : "text-white"}`}>
            hotke<span className="text-primary">food</span>
          </span>
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`font-medium transition-all duration-300 text-sm relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 ${isActive(link.id)
                ? scrolled
                  ? "text-primary after:w-full"
                  : "text-white after:w-full"
                : scrolled
                  ? "text-muted-foreground hover:text-primary after:w-0 hover:after:w-full"
                  : "text-white/80 hover:text-white after:w-0 hover:after:w-full"
                }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Mobile toggle */}
        <button
          className={`md:hidden p-2 rounded-lg transition-colors ${scrolled
            ? "text-foreground hover:bg-accent"
            : "text-white hover:bg-white/10"
            }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={`md:hidden border-b border-border ${scrolled
            ? "bg-background/95 backdrop-blur-xl"
            : "bg-[hsl(222,40%,10%)]/95 backdrop-blur-xl"
            }`}
        >
          <div className="flex flex-col gap-1 p-4">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`font-medium transition-colors px-4 py-3 rounded-lg ${isActive(link.id)
                  ? "text-primary bg-primary/10"
                  : scrolled
                    ? "text-muted-foreground hover:text-foreground hover:bg-accent"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
