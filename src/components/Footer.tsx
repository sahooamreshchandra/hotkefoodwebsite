import logo from "../assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-[hsl(222,40%,6%)] py-6 mt-12 relative overflow-hidden border-t border-white/5">
      {/* Subtle background accent */}
      <div className="absolute inset-0 dot-pattern opacity-5 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Brand & Copyright */}
          <div className="flex items-center gap-4 shrink-0">
            <img src={logo} alt="hotkefood logo" className="h-8 w-8 object-contain rounded-lg shadow-glow" />
            <p className="text-white/70 text-sm font-medium whitespace-nowrap">
              © {new Date().getFullYear()}              hotke<span className="text-primary">food</span>. All rights reserved.
            </p>
          </div>


          {/* Legal Disclaimer */}
          <div className="max-w-xl">
            <p className="text-white/30 text-[9px] leading-relaxed uppercase tracking-wider lg:text-right">
              hotke<span className="text-primary/70">food</span> is a proposed partnership firm. Partnership registration is under process.
              Food services will commence only after obtaining all required registrations including FSSAI.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
