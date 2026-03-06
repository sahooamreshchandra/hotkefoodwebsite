import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Register Your School",
    description:
      "Sign up and add your child's school via our mobile app. It takes less than a minute.",
    emoji: "🏫",
  },
  {
    number: "02",
    title: "Choose Your Meals",
    description:
      "Choose your menu, based on your requirements - (Daily / Weekly / Monthly).",
    emoji: "📋",
  },
  {
    number: "03",
    title: "Place Your Order",
    description:
      "Confirm and pay securely online.",
    emoji: "💳",
  },
  {
    number: "04",
    title: "Delivered Fresh",
    description:
      "Fresh meals delivered to your child's classroom directly.",
    emoji: "🚚",
  },
];

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="py-10 md:py-16 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <span className="inline-flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider bg-orange-50 border border-orange-100 px-5 py-2 rounded-full mb-6">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-extrabold text-gray-900">
            Four simple steps to{" "}
            <span className="bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
              happy and delicious food
            </span>
          </h2>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connection line (desktop) */}
          <div className="hidden lg:block absolute top-12 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12, duration: 0.5 }}
                className="relative text-center group"
              >
                {/* Step icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-[72px] h-[72px] mx-auto mb-6 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center justify-center text-3xl group-hover:shadow-[0_8px_30px_hsl(25,100%,50%,0.15)] group-hover:border-primary/30 transition-all duration-300"
                >
                  {step.emoji}
                </motion.div>

                {/* Step number */}
                <span className="text-3xl font-display font-extrabold text-primary/20 block mb-1">
                  {step.number}
                </span>
                <h3 className="font-display font-bold text-base text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-[200px] mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
