import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { QuickInfo } from "@/components/quick-info"
import { ExhibitsGrid } from "@/components/exhibits-grid"
import { ExperienceSection } from "@/components/experience-section"
import { ConservationSection } from "@/components/conservation-section"
import { Footer } from "@/components/footer"

export default function ZooExhibitsPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <QuickInfo />
      <ExhibitsGrid />
      <ExperienceSection />
      <ConservationSection />
      <Footer />
    </main>
  )
}
