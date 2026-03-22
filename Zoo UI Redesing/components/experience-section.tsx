"use client"

import { Calendar, Heart, Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

const experiences = [
  {
    icon: Heart,
    title: "Animal Encounters",
    description:
      "Get up close with your favorite animals in our guided encounter experiences. Feed giraffes, meet penguins, and more.",
    cta: "Book Now",
  },
  {
    icon: Users,
    title: "Behind the Scenes",
    description:
      "Go where most visitors can't. Learn about animal care, nutrition, and conservation from our expert keepers.",
    cta: "Learn More",
  },
  {
    icon: Calendar,
    title: "Daily Programs",
    description:
      "Join us for feeding times, keeper talks, and educational presentations happening throughout the day.",
    cta: "See Schedule",
  },
  {
    icon: Sparkles,
    title: "Special Events",
    description:
      "From night safaris to seasonal celebrations, discover unique ways to experience the zoo after hours.",
    cta: "View Events",
  },
]

export function ExperienceSection() {
  return (
    <section className="py-20 lg:py-28 bg-secondary">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Content */}
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              Unforgettable Moments
            </span>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl text-balance">
              More Than Just a Visit
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Create lasting memories with immersive experiences that bring you closer to the animal kingdom than ever before.
            </p>
            
            <div className="mt-8">
              <Button size="lg" className="h-12 px-6">
                Explore All Experiences
              </Button>
            </div>
          </div>

          {/* Right Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {experiences.map((experience) => (
              <div
                key={experience.title}
                className="group rounded-2xl bg-card p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <experience.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {experience.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {experience.description}
                </p>
                <button className="mt-4 text-sm font-medium text-primary transition-colors hover:text-primary/80">
                  {experience.cta} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
