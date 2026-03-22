import { ExhibitCard } from "./exhibit-card"

const exhibits = [
  {
    title: "African Savanna",
    description:
      "Journey through the golden grasslands and encounter majestic lions, towering giraffes, and the thundering herds of elephants.",
    image: "/images/lion.jpg",
    location: "Zone A",
    hours: "9AM - 5PM",
    featured: true,
  },
  {
    title: "Elephant Sanctuary",
    description:
      "Experience the gentle giants up close in our award-winning sanctuary dedicated to Asian elephant conservation.",
    image: "/images/elephant.jpg",
    location: "Zone B",
    hours: "9AM - 5:30PM",
    featured: false,
  },
  {
    title: "Penguin Cove",
    description:
      "Dive into the icy waters of Antarctica and watch our colony of penguins play and swim.",
    image: "/images/penguin.jpg",
    location: "Zone C",
    hours: "10AM - 4PM",
    featured: false,
  },
  {
    title: "Rainforest Discovery",
    description:
      "Trek through the lush tropical forest and meet our family of western lowland gorillas in their naturalistic habitat.",
    image: "/images/gorilla.jpg",
    location: "Zone D",
    hours: "9AM - 5PM",
    featured: false,
  },
  {
    title: "Giraffe Heights",
    description:
      "Get eye-to-eye with the world's tallest animals at our elevated feeding platform experience.",
    image: "/images/giraffe.jpg",
    location: "Zone A",
    hours: "10AM - 4PM",
    featured: false,
  },
  {
    title: "Tiger Territory",
    description:
      "Witness the power and grace of Bengal tigers in our immersive jungle habitat with underwater viewing.",
    image: "/images/tiger.jpg",
    location: "Zone E",
    hours: "9AM - 5PM",
    featured: true,
  },
]

export function ExhibitsGrid() {
  return (
    <section id="exhibits" className="py-20 lg:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Explore Our World
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl text-balance">
            Featured Exhibits
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Discover incredible animals from every corner of the globe in our thoughtfully designed habitats that prioritize animal welfare and visitor education.
          </p>
        </div>

        {/* Exhibits Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exhibits.map((exhibit) => (
            <ExhibitCard key={exhibit.title} {...exhibit} />
          ))}
        </div>

        {/* View All Link */}
        <div className="mt-12 text-center">
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            View All 25 Exhibits
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
