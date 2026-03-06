import { motion } from "framer-motion";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { useState } from "react";

const TopBanner = () => {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-[60] overflow-hidden"
        >
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(217,91%,48%)] via-[hsl(230,80%,52%)] to-[hsl(245,70%,55%)]" />

            {/* Animated shimmer */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            </div>

            {/* Dot pattern */}
            <div className="absolute inset-0 dot-pattern opacity-20" />

            {/* <div className="relative flex items-center justify-center gap-3 px-4 py-2.5 text-white">
                <Sparkles className="w-4 h-4 text-yellow-300 flex-shrink-0 hidden sm:block" />
                <p className="text-sm font-medium text-center">
                    <span className="font-bold">🎉 First week FREE!</span>
                    <span className="hidden sm:inline"> — Try our healthy school meals with zero commitment.</span>
                    <a
                        href="#contact"
                        className="inline-flex items-center gap-1 ml-2 font-bold underline underline-offset-2 hover:text-yellow-200 transition-colors"
                    >
                        Get Started
                        <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                </p>

                <button
                    onClick={() => setVisible(false)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/15 transition-colors"
                    aria-label="Dismiss banner"
                >
                    <X className="w-4 h-4 text-white/70 hover:text-white" />
                </button>
            </div> */}
        </motion.div>
    );
};

export default TopBanner;
