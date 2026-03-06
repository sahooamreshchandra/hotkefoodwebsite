import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Daily Plan",
    price: "₹79",
    period: "per day",
    description: "Perfect for trying us out",
    features: [
      "1 meal per day",
      "Choose breakfast or lunch",
      "Fresh & hygienic",
      "Allergen-safe options",
    ],
    popular: false,
  },
  {
    name: "Weekly Plan",
    price: "₹449",
    period: "per week",
    description: "Most popular among parents",
    features: [
      "5 meals per week",
      "Breakfast + Lunch combo",
      "Snack box included",
      "Weekly menu variety",
      "Priority delivery",
    ],
    popular: true,
  },
  {
    name: "Monthly Plan",
    price: "₹1,599",
    period: "per month",
    description: "Best value for families",
    features: [
      "22 meals per month",
      "Full day meals + snacks",
      "Festival specials included",
      "Dedicated support",
      "Sibling discount available",
      "Free trial first week",
    ],
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-sm font-bold text-primary uppercase tracking-wider">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-foreground mt-3">
            Affordable plans for every family
          </h2>
          <p className="text-muted-foreground mt-3">
            Choose a plan that works best for you. No hidden charges, cancel anytime.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "bg-gradient-hero text-primary-foreground border-primary shadow-elevated scale-105"
                  : "bg-card border-border hover:shadow-elevated"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className={`font-display font-bold text-lg ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}>
                {plan.name}
              </h3>
              <p className={`text-sm mt-1 ${plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {plan.description}
              </p>
              <div className="mt-6 mb-6">
                <span className={`text-4xl font-display font-extrabold ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}>
                  {plan.price}
                </span>
                <span className={`text-sm ml-1 ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {plan.period}
                </span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 flex-shrink-0 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
                    <span className={plan.popular ? "text-primary-foreground/90" : "text-foreground"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.popular ? "secondary" : "hero"}
                size="lg"
                className="w-full"
                asChild
              >
                <a href="#contact">Get Started</a>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
