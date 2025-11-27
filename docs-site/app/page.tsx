import Hero from '@/components/Landing/Hero';
import Features from '@/components/Landing/Features';
import QuickStart from '@/components/Landing/QuickStart';
import PerformanceHighlights from '@/components/Landing/PerformanceHighlights';
import Footer from '@/components/Landing/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <QuickStart />
      <PerformanceHighlights />
      <Footer />
    </main>
  );
}
