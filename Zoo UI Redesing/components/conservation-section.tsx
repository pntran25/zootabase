import { Button } from "@/components/ui/button"
import { Globe, Leaf, Shield } from "lucide-react"

const stats = [
  { value: "47", label: "Conservation Projects" },
  { value: "$12M+", label: "Funds Raised" },
  { value: "18", label: "Species Protected" },
]

const initiatives = [
  {
    icon: Shield,
    title: "Species Protection",
    description: "Active breeding programs for endangered species including snow leopards and red pandas.",
  },
  {
    icon: Globe,
    title: "Global Partnerships",
    description: "Working with conservation organizations in 23 countries to protect wildlife habitats.",
  },
  {
    icon: Leaf,
    title: "Sustainability",
    description: "Carbon-neutral operations and 100% renewable energy powering all zoo facilities.",
  },
]

export function ConservationSection() {
  return (
    <section id="conservation" className="py-20 lg:py-28 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/70">
            Making a Difference
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl text-balance">
            Conservation at Our Core
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80 leading-relaxed">
            Every visit supports our mission to protect wildlife and preserve habitats for future generations.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-12 flex flex-wrap justify-center gap-12 lg:gap-20">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-5xl font-bold">{stat.value}</p>
              <p className="mt-2 text-sm text-primary-foreground/70">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Initiatives */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {initiatives.map((initiative) => (
            <div
              key={initiative.title}
              className="rounded-2xl bg-primary-foreground/10 p-6 backdrop-blur-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/20">
                <initiative.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{initiative.title}</h3>
              <p className="mt-2 text-sm text-primary-foreground/80 leading-relaxed">
                {initiative.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button
            size="lg"
            variant="secondary"
            className="h-12 px-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            Support Our Mission
          </Button>
        </div>
      </div>
    </section>
  )
}
