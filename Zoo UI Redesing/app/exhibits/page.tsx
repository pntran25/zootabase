"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowRight, Clock, Filter, Grid3X3, List, MapPin, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

const regions = ["All Regions", "Africa", "Asia", "Antarctica", "Americas", "Australia"]

const exhibits = [
  {
    id: 1,
    title: "African Savanna",
    description: "Experience the vast grasslands of Africa, home to majestic lions, towering giraffes, and graceful elephants. Our award-winning habitat recreates the authentic ecosystem of the Serengeti.",
    image: "/images/lion.jpg",
    location: "Zone A",
    hours: "9AM - 6PM",
    region: "Africa",
    animals: ["Lions", "Giraffes", "Zebras", "Elephants"],
    animalCount: 45,
    size: "12 acres",
    featured: true,
  },
  {
    id: 2,
    title: "Elephant Sanctuary",
    description: "Walk alongside our family of African elephants in this expansive sanctuary designed to mirror their natural habitat. Watch daily enrichment activities and feeding sessions.",
    image: "/images/elephant.jpg",
    location: "Zone A",
    hours: "9AM - 5PM",
    region: "Africa",
    animals: ["African Elephants"],
    animalCount: 8,
    size: "8 acres",
  },
  {
    id: 3,
    title: "Penguin Cove",
    description: "Journey to the Antarctic without leaving the city. Our climate-controlled habitat houses three species of penguins in an authentic icy environment.",
    image: "/images/penguin.jpg",
    location: "Zone C",
    hours: "10AM - 5PM",
    region: "Antarctica",
    animals: ["Emperor Penguins", "King Penguins", "Gentoo Penguins"],
    animalCount: 62,
    size: "2 acres",
  },
  {
    id: 4,
    title: "Tropical Rainforest",
    description: "Step into a world of lush vegetation and incredible biodiversity. Our rainforest exhibit features gorillas, exotic birds, and rare reptiles in a climate-controlled dome.",
    image: "/images/gorilla.jpg",
    location: "Zone B",
    hours: "9AM - 6PM",
    region: "Africa",
    animals: ["Western Lowland Gorillas", "Tropical Birds", "Reptiles"],
    animalCount: 120,
    size: "5 acres",
    featured: true,
  },
  {
    id: 5,
    title: "Asian Highlands",
    description: "Discover the diverse wildlife of Asian mountain ranges. Home to Bengal tigers, red pandas, and snow leopards in recreated highland terrain.",
    image: "/images/tiger.jpg",
    location: "Zone D",
    hours: "9AM - 5:30PM",
    region: "Asia",
    animals: ["Bengal Tigers", "Red Pandas", "Snow Leopards"],
    animalCount: 28,
    size: "6 acres",
  },
  {
    id: 6,
    title: "Giraffe Heights",
    description: "Get eye-to-eye with the world's tallest mammals at our elevated viewing platform. Feed giraffes during our interactive sessions every afternoon.",
    image: "/images/giraffe.jpg",
    location: "Zone A",
    hours: "9AM - 6PM",
    region: "Africa",
    animals: ["Reticulated Giraffes", "Masai Giraffes"],
    animalCount: 12,
    size: "4 acres",
  },
]

export default function ExhibitsPage() {
  const [selectedRegion, setSelectedRegion] = useState("All Regions")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filteredExhibits = exhibits.filter((exhibit) => {
    const matchesRegion = selectedRegion === "All Regions" || exhibit.region === selectedRegion
    const matchesSearch = exhibit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exhibit.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exhibit.animals.some(animal => animal.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesRegion && matchesSearch
  })

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-16">
        <div className="relative h-[40vh] min-h-[320px] overflow-hidden">
          <Image
            src="/images/hero-wildlife.jpg"
            alt="Zoo exhibits"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-background" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight text-balance">
                Our Exhibits
              </h1>
              <p className="mt-4 text-lg md:text-xl text-white/80 max-w-2xl mx-auto text-balance">
                Explore immersive habitats from around the world and connect with over 500 species
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="sticky top-16 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search and Filter */}
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search exhibits or animals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon" className="shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Region Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {regions.map((region) => (
                <Button
                  key={region}
                  variant={selectedRegion === region ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRegion(region)}
                  className="shrink-0"
                >
                  {region}
                </Button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="hidden lg:flex items-center gap-1 border border-border rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Results Count */}
      <section className="mx-auto max-w-7xl px-4 pt-8 lg:px-8">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filteredExhibits.length}</span> exhibits
        </p>
      </section>

      {/* Exhibits Grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredExhibits.map((exhibit) => (
              <ExhibitGridCard key={exhibit.id} exhibit={exhibit} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredExhibits.map((exhibit) => (
              <ExhibitListCard key={exhibit.id} exhibit={exhibit} />
            ))}
          </div>
        )}

        {filteredExhibits.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No exhibits found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}

interface Exhibit {
  id: number
  title: string
  description: string
  image: string
  location: string
  hours: string
  region: string
  animals: string[]
  animalCount: number
  size: string
  featured?: boolean
}

function ExhibitGridCard({ exhibit }: { exhibit: Exhibit }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:shadow-xl hover:border-primary/20">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={exhibit.image}
          alt={exhibit.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-3 py-1 text-xs font-medium text-foreground">
            {exhibit.region}
          </span>
        </div>
        {exhibit.featured && (
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              Featured
            </span>
          </div>
        )}
      </div>
      
      <div className="p-5">
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {exhibit.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {exhibit.hours}
          </span>
        </div>
        
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {exhibit.title}
        </h2>
        
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {exhibit.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {exhibit.animals.slice(0, 3).map((animal) => (
            <span
              key={animal}
              className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
            >
              {animal}
            </span>
          ))}
          {exhibit.animals.length > 3 && (
            <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
              +{exhibit.animals.length - 3} more
            </span>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {exhibit.animalCount} animals
            </span>
            <span>{exhibit.size}</span>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 text-primary hover:text-primary">
            Visit
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </article>
  )
}

function ExhibitListCard({ exhibit }: { exhibit: Exhibit }) {
  return (
    <article className="group flex flex-col md:flex-row overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:shadow-xl hover:border-primary/20">
      <div className="relative w-full md:w-80 shrink-0 aspect-video md:aspect-auto overflow-hidden">
        <Image
          src={exhibit.image}
          alt={exhibit.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-3 py-1 text-xs font-medium text-foreground">
            {exhibit.region}
          </span>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {exhibit.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {exhibit.hours}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {exhibit.animalCount} animals
              </span>
              <span>{exhibit.size}</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {exhibit.title}
            </h2>
          </div>
          {exhibit.featured && (
            <span className="shrink-0 inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              Featured
            </span>
          )}
        </div>
        
        <p className="mt-3 text-muted-foreground flex-1">
          {exhibit.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {exhibit.animals.map((animal) => (
              <span
                key={animal}
                className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
              >
                {animal}
              </span>
            ))}
          </div>
          <Button className="gap-1.5 shrink-0">
            Visit Exhibit
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  )
}
