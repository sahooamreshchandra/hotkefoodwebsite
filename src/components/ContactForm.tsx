import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MessageCircle, Send, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// 🔧 REPLACE THIS with your deployed Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzJ8BgB4wDDwOmeQw-cA6tlV1PuEmho4fl6w38gIwINoGza4wneS19ssz3bpOI1NtzzGw/exec";
const WHATSAPP_NUMBER = "917008401800";

const ContactForm = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    school: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({
        title: "Please fill in required fields",
        description: "Name, email and message are required.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || "—",
        school: form.school.trim() || "—",
        message: form.message.trim(),
        submittedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      };

      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      toast({
        title: "Message sent! 🎉",
        description: "We've received your enquiry and will get back to you within 24 hours.",
      });

      setForm({ name: "", email: "", phone: "", school: "", message: "" });
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try WhatsApp or call us directly.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi hotkefood! I'm interested in school meal plans. My name is ${form.name || "[Your Name]"} and I'd like to learn more.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
  };

  return (
    <section id="contact" className="py-10 md:py-16 bg-white relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[140px] -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none opacity-60" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="inline-flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-widest bg-blue-50 border border-blue-100 px-6 py-2 rounded-full mb-6">
            📩 Get In Touch
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold text-gray-900 tracking-tight leading-tight">
            Ready to <span className="text-primary">upgrade</span> school Tiffin Boxes?
          </h2>
          <p className="text-gray-500 mt-6 text-lg font-medium">
            Join the hotkefood family. Reach out today and we'll get back to you within 24 hours.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 max-w-7xl mx-auto">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3 bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-elevated"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-2 block ml-1">
                    Full Name <span className="text-primary">*</span>
                  </label>
                  <Input
                    name="name"
                    placeholder="Enter your name"
                    value={form.name}
                    onChange={handleChange}
                    maxLength={100}
                    required
                    className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:border-primary focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-2 block ml-1">
                    Email Address <span className="text-primary">*</span>
                  </label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={handleChange}
                    maxLength={255}
                    required
                    className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:border-primary focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-2 block ml-1">
                    Phone Number
                  </label>
                  <Input
                    name="phone"
                    type="tel"
                    placeholder="00000 00000"
                    value={form.phone}
                    onChange={handleChange}
                    maxLength={15}
                    className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:border-primary focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-2 block ml-1">
                    School Name
                  </label>
                  <Input
                    name="school"
                    placeholder="Child's school name"
                    value={form.school}
                    onChange={handleChange}
                    maxLength={150}
                    className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:border-primary focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-2 block ml-1">
                  How can we help? <span className="text-primary">*</span>
                </label>
                <Textarea
                  name="message"
                  placeholder="Share your thoughts or questions..."
                  value={form.message}
                  onChange={handleChange}
                  rows={5}
                  maxLength={1000}
                  required
                  className="rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:border-primary focus:ring-primary/20 transition-all font-medium resize-none"
                />
              </div>
              {/* <Button
                size="xl"
                className="w-full h-14 font-bold bg-primary hover:bg-primary/95 text-white shadow-glow rounded-2xl text-lg group"
                type="submit"
                disabled={sending}
              >
                Send Message
                <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button> */}
            </form>
          </motion.div>

          {/* Contact info */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[hsl(222,40%,10%)] to-[hsl(222,30%,16%)] rounded-[2.5rem] p-8 md:p-10 text-white shadow-elevated h-full flex flex-col justify-between"
            >
              <div>
                <h3 className="font-display font-extrabold text-2xl mb-4 tracking-tight">
                  Connect with us <span className="text-primary">directly</span>
                </h3>
                <p className="text-white/60 text-base leading-relaxed mb-10 font-medium">
                  Have a specific question? Our team is ready to help you every step of the way.
                </p>

                <div className="space-y-4">
                  {/* <button
                    onClick={openWhatsApp}
                    className="flex items-center gap-4 w-full p-4 rounded-[1.5rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest">WhatsApp</p>
                      <p className="font-bold text-lg">+91 70084 01800</p>
                    </div>
                  </button> */}

                  {/* <a
                    href="tel:+917008401800"
                    className="flex items-center gap-4 w-full p-4 rounded-[1.5rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-primary shadow-[0_0_20px_hsl(25,100%,50%,0.3)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest">Call Us</p>
                      <p className="font-bold text-lg">+91 70084 01800</p>
                    </div>
                  </a> */}

                  <a
                    href="mailto:hotkefood@gmail.com"
                    className="flex items-center gap-4 w-full p-4 rounded-[1.5rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest">Email</p>
                      <p className="font-bold text-lg">hotkefood@gmail.com</p>
                    </div>
                  </a>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/10 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest">Available</p>
                  <p className="font-bold text-sm">Mon–Sat, 9AM – 6PM</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
