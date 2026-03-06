import { Shield, Award, Heart, Users, Truck, Clock } from "lucide-react";

const items = [
  { icon: Shield, text: "FSSAI Certified (Yet to be updated)" },
  { icon: Truck, text: "On-time Delivery" },
  { icon: Clock, text: "Fresh Daily" },
];

const TrustBanner = () => {
  return (
    <section className="py-5 bg-[hsl(222,30%,15%)] border-b border-white/5 overflow-hidden">
      <div className="relative">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...items, ...items, ...items].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 mx-8">
              <item.icon className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold tracking-wide text-white/70">{item.text}</span>
              <span className="mx-4 text-white/15">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBanner;
