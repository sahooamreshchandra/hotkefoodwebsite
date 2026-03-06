import Navbar from "@/components/Navbar";
import TopBanner from "@/components/TopBanner";
import Hero from "@/components/Hero";
import TrustBanner from "@/components/TrustBanner";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopBanner />
      <Navbar />
      <Hero />
      <TrustBanner />
      <Features />
      <HowItWorks />
      <ContactForm />
      <Footer />
    </div>
  );
};

export default Index;
