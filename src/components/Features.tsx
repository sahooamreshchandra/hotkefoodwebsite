import { motion } from "framer-motion";
import {
  CalendarCheck,
  Truck,
  Utensils,
  Sparkles,
  HeartPulse,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: CalendarCheck,
    title: "Easy Daily & Weekly Orders",
    description:
      "Plan meals for the day or entire week in under 2 minutes. Set it and forget it.",
    accent: "hsl(25,100%,50%)",
    iconBg: "bg-orange-50",
    iconColor: "text-primary",
    glow: "group-hover:shadow-[0_8px_30px_hsl(25,100%,50%,0.15)]",
  },
  {
    icon: Utensils,
    title: "Certified Menus",
    description:
      "Our plan is to work with the parents to make it more certified.",
    accent: "hsl(25,100%,50%)",
    iconBg: "bg-orange-50",
    iconColor: "text-primary",
    glow: "group-hover:shadow-[0_8px_30px_hsl(25,100%,50%,0.15)]",
  },
  {
    icon: Truck,
    title: "Delivered to School",
    description:
      "Fresh foods delivered directly to your child's classroom on time.",
    accent: "hsl(25,100%,50%)",
    iconBg: "bg-orange-50",
    iconColor: "text-primary",
    glow: "group-hover:shadow-[0_8px_30px_hsl(25,100%,50%,0.15)]",
  },
  {
    icon: HeartPulse,
    title: "Balanced Nutrition",
    description:
      "Every meal is designed with the right balance of proteins, carbs and vitamins.",
    accent: "hsl(25,100%,50%)",
    iconBg: "bg-orange-50",
    iconColor: "text-primary",
    glow: "group-hover:shadow-[0_8px_30px_hsl(25,100%,50%,0.15)]",
  },
  {
    icon: Sparkles,
    title: "Hygienic Kitchen",
    description:
      "Daily audits and strict quality controlled by the founder and voluntary parents.",
    accent: "hsl(25,100%,50%)",
    iconBg: "bg-orange-50",
    iconColor: "text-primary",
    glow: "group-hover:shadow-[0_8px_30px_hsl(25,100%,50%,0.15)]",
  },
  {
    icon: Smartphone,
    title: "Smart Mobile App",
    description:
      "Manage and schedule orders on your phone.",
    accent: "hsl(25,100%,50%)",
    iconBg: "bg-orange-50",
    iconColor: "text-primary",
    glow: "group-hover:shadow-[0_8px_30px_hsl(25,100%,50%,0.15)]",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const Features = () => {
  return (
    <section className="py-10 md:py-16 bg-[hsl(222,30%,97%)] relative overflow-hidden">
      {/* Brand-themed blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-100/30 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-50/40 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-extrabold text-gray-900 tracking-tight">
            Making school meals{" "}
            <span className="bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
              simple & delicious
            </span>
          </h2>
          <p className="text-gray-500 mt-4 text-lg max-w-lg mx-auto leading-relaxed">
            Everything your child needs for a great lunch — without the morning rush.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              whileHover={{
                y: -6,
                scale: 1.02,
                transition: { duration: 0.25, ease: "easeOut" },
              }}
              className={`group relative bg-white rounded-2xl p-7 border border-gray-100 hover:border-primary/30 shadow-sm hover:shadow-lg transition-all duration-400 overflow-hidden cursor-default ${feature.glow}`}
            >
              {/* Top accent bar – sweeps in on hover */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-amber-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-t-2xl" />

              {/* Warm orange tint on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-amber-400/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

              {/* Icon */}
              <div className={`relative w-14 h-14 rounded-2xl ${feature.iconBg} border border-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
              </div>

              {/* Text */}
              <h3 className="text-lg font-bold mb-2 text-gray-900 tracking-tight group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed relative z-10">
                {feature.description}
              </p>

              {/* Corner deco */}
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tl-[2rem]" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
