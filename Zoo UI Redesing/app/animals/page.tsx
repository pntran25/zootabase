"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowRight, Clock, Filter, Grid3X3, Heart, Info, List, MapPin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

const categories = ["All Animals", "Mammals", "Birds", "Reptiles", "Marine", "Primates"]
const conservationStatuses = ["All", "Critically Endangered", "Endangered", "Vulnerable", "Near Threatened", "Least Concern"]

const animals = [
  {
    id: 1,
    name: "African Lion",
    scientificName: "Panthera leo",
    image: "/images/lion.jpg",
    category: "Mammals",
    exhibit: "African Savanna",
    region: "Africa",
    conservationStatus: "Vulnerable",
    feedingTime: "11:00 AM",
    description: "The lion is a large cat of the genus Panthera native to Africa and India. It is the most social of all wild felid species, living in groups called prides.",
    funFact: "A lion's roar can be heard from 5 miles away.",
    lifespan: "10-14 years",
    diet: "Carnivore",
    weight: "265-420 lbs",
  },
  {
    id: 2,
    name: "African Elephant",
    scientificName: "Loxodonta africana",
    image: "/images/elephant.jpg",
    category: "Mammals",
    exhibit: "Elephant Sanctuary",
    region: "Africa",
    conservationStatus: "Endangered",
    feedingTime: "10:00 AM",
    description: "The African elephant is the largest living terrestrial animal, with males reaching heights of up to 13 feet and weighing up to 14,000 pounds.",
    funFact: "Elephants can recognize themselves in mirrors.",
    lifespan: "60-70 years",
    diet: "Herbivore",
    weight: "6,000-14,000 lbs",
  },
  {
    id: 3,
    name: "Emperor Penguin",
    scientificName: "Aptenodytes forsteri",
    image: "/images/penguin.jpg",
    category: "Birds",
    exhibit: "Penguin Cove",
    region: "Antarctica",
    conservationStatus: "Near Threatened",
    feedingTime: "2:00 PM",
    description: "The emperor penguin is the tallest and heaviest of all living penguin species and is endemic to Antarctica.",
    funFact: "Emperor penguins can dive to depths of 1,850 feet.",
    lifespan: "15-20 years",
    diet: "Carnivore",
    weight: "49-99 lbs",
  },
  {
    id: 4,
    name: "Western Lowland Gorilla",
    scientificName: "Gorilla gorilla gorilla",
    image: "/images/gorilla.jpg",
    category: "Primates",
    exhibit: "Tropical Rainforest",
    region: "Africa",
    conservationStatus: "Critically Endangered",
    feedingTime: "9:30 AM",
    description: "The western lowland gorilla is one of two subspecies of the western gorilla and the most numerous of all gorilla subspecies.",
    funFact: "Gorillas share 98.3% of their DNA with humans.",
    lifespan: "35-40 years",
    diet: "Herbivore",
    weight: "150-400 lbs",
  },
  {
    id: 5,
    name: "Bengal Tiger",
    scientificName: "Panthera tigris tigris",
    image: "/images/tiger.jpg",
    category: "Mammals",
    exhibit: "Asian Highlands",
    region: "Asia",
    conservationStatus: "Endangered",
    feedingTime: "3:00 PM",
    description: "The Bengal tiger is a population of the Panthera tigris tigris subspecies and the most numerous tiger subspecies.",
    funFact: "No two tigers have the same stripe pattern.",
    lifespan: "8-10 years",
    diet: "Carnivore",
    weight: "220-660 lbs",
  },
  {
    id: 6,
    name: "Reticulated Giraffe",
    scientificName: "Giraffa camelopardalis reticulata",
    image: "/images/giraffe.jpg",
    category: "Mammals",
    exhibit: "Giraffe Heights",
    region: "Africa",
    conservationStatus: "Endangered",
    feedingTime: "1:00 PM",
    description: "The reticulated giraffe is a subspecies of giraffe native to the Horn of Africa, distinguished by its distinctive coat pattern.",
    funFact: "A giraffe's tongue is 18-20 inches long and dark purple.",
    lifespan: "20-25 years",
    diet: "Herbivore",
    weight: "1,750-2,800 lbs",
  },
  {
    id: 7,
    name: "Red Panda",
    scientificName: "Ailurus fulgens",
    image: "/images/red-panda.jpg",
    category: "Mammals",
    exhibit: "Asian Highlands",
    region: "Asia",
    conservationStatus: "Endangered",
    feedingTime: "4:00 PM",
    description: "The red panda is a small mammal native to the eastern Himalayas and southwestern China, known for its rust-colored fur.",
    funFact: "Red pandas spend most of their lives in trees.",
    lifespan: "8-10 years",
    diet: "Herbivore",
    weight: "7-14 lbs",
  },
  {
    id: 8,
    name: "Plains Zebra",
    scientificName: "Equus quagga",
    image: "/images/zebra.jpg",
    category: "Mammals",
    exhibit: "African Savanna",
    region: "Africa",
    conservationStatus: "Near Threatened",
    feedingTime: "11:30 AM",
    description: "The plains zebra is the most common and geographically widespread species of zebra, known for its distinctive black and white stripes.",
    funFact: "Each zebra's stripe pattern is unique, like fingerprints.",
    lifespan: "20-25 years",
    diet: "Herbivore",
    weight: "770-990 lbs",
  },
  {
    id: 9,
    name: "Snow Leopard",
    scientificName: "Panthera uncia",
    image: "/images/snow-leopard.jpg",
    category: "Mammals",
    exhibit: "Asian Highlands",
    region: "Asia",
    conservationStatus: "Vulnerable",
    feedingTime: "2:30 PM",
    description: "The snow leopard is a large cat native to the mountain ranges of Central and South Asia, perfectly adapted to cold, harsh environments.",
    funFact: "Snow leopards can leap up to 50 feet in a single bound.",
    lifespan: "10-12 years",
    diet: "Carnivore",
    weight: "60-120 lbs",
  },
  {
    id: 10,
    name: "American Flamingo",
    scientificName: "Phoenicopterus ruber",
    image: "/images/flamingo.jpg",
    category: "Birds",
    exhibit: "Tropical Lagoon",
    region: "Americas",
    conservationStatus: "Least Concern",
    feedingTime: "10:30 AM",
    description: "The American flamingo is a large wading bird with reddish-pink plumage, known for standing on one leg.",
    funFact: "Flamingos are pink because of the shrimp they eat.",
    lifespan: "40-60 years",
    diet: "Omnivore",
    weight: "4-8 lbs",
  },
  {
    id: 11,
    name: "California Sea Lion",
    scientificName: "Zalophus californianus",
    image: "/images/sea-lion.jpg",
    category: "Marine",
    exhibit: "Ocean World",
    region: "Americas",
    conservationStatus: "Least Concern",
    feedingTime: "12:00 PM",
    description: "The California sea lion is a coastal eared seal native to western North America, known for its intelligence and playfulness.",
    funFact: "Sea lions can hold their breath for up to 20 minutes.",
    lifespan: "20-30 years",
    diet: "Carnivore",
    weight: "220-860 lbs",
  },
]

const statusColors: Record<string, string> = {
  "Critically Endangered": "bg-red-500/10 text-red-600 border-red-200",
  "Endangered": "bg-orange-500/10 text-orange-600 border-orange-200",
  "Vulnerable": "bg-amber-500/10 text-amber-600 border-amber-200",
  "Near Threatened": "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  "Least Concern": "bg-green-500/10 text-green-600 border-green-200",
}

export default function AnimalsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All Animals")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)

  const filteredAnimals = animals.filter((animal) => {
    const matchesCategory = selectedCategory === "All Animals" || animal.category === selectedCategory
    const matchesStatus = selectedStatus === "All" || animal.conservationStatus === selectedStatus
    const matchesSearch = animal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.exhibit.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesStatus && matchesSearch
  })

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-16">
        <div className="relative h-[40vh] min-h-[320px] overflow-hidden">
          <Image
            src="/images/tiger.jpg"
            alt="Zoo animals"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-background" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight text-balance">
                Meet Our Animals
              </h1>
              <p className="mt-4 text-lg md:text-xl text-white/80 max-w-2xl mx-auto text-balance">
                Discover over 500 species from every corner of the globe
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="sticky top-16 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Search */}
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search animals by name or exhibit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="shrink-0"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              {/* Category Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="shrink-0"
                  >
                    {category}
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

            {/* Conservation Status Filter */}
            {showFilters && (
              <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-border">
                <span className="text-sm font-medium text-muted-foreground shrink-0">Conservation Status:</span>
                {conservationStatuses.map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus(status)}
                    className="shrink-0"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results Count */}
      <section className="mx-auto max-w-7xl px-4 pt-8 lg:px-8">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filteredAnimals.length}</span> animals
        </p>
      </section>

      {/* Animals Grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAnimals.map((animal) => (
              <AnimalGridCard key={animal.id} animal={animal} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredAnimals.map((animal) => (
              <AnimalListCard key={animal.id} animal={animal} />
            ))}
          </div>
        )}

        {filteredAnimals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No animals found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}

interface Animal {
  id: number
  name: string
  scientificName: string
  image: string
  category: string
  exhibit: string
  region: string
  conservationStatus: string
  feedingTime: string
  description: string
  funFact: string
  lifespan: string
  diet: string
  weight: string
}

function AnimalGridCard({ animal }: { animal: Animal }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <article 
      className="group relative overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:shadow-xl hover:border-primary/20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={animal.image}
          alt={animal.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        
        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <span className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm",
            statusColors[animal.conservationStatus]
          )}>
            {animal.conservationStatus}
          </span>
          <button className="p-2 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-red-500 transition-colors">
            <Heart className="h-4 w-4" />
          </button>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-xs text-white/70 italic">{animal.scientificName}</p>
          <h2 className="text-xl font-bold text-white tracking-tight">{animal.name}</h2>
          
          <div className="flex items-center gap-3 mt-2 text-xs text-white/80">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {animal.exhibit}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {animal.feedingTime}
            </span>
          </div>
        </div>

        {/* Hover overlay */}
        <div className={cn(
          "absolute inset-0 bg-foreground/90 p-4 flex flex-col justify-center transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div className="text-white">
            <h3 className="font-semibold text-sm mb-2">Quick Facts</h3>
            <div className="space-y-1.5 text-xs text-white/80">
              <p><span className="text-white/60">Diet:</span> {animal.diet}</p>
              <p><span className="text-white/60">Lifespan:</span> {animal.lifespan}</p>
              <p><span className="text-white/60">Weight:</span> {animal.weight}</p>
              <p><span className="text-white/60">Region:</span> {animal.region}</p>
            </div>
            <div className="mt-3 p-2 bg-white/10 rounded-lg">
              <p className="text-xs text-white/90 flex items-start gap-1.5">
                <Info className="h-3 w-3 shrink-0 mt-0.5" />
                {animal.funFact}
              </p>
            </div>
            <Button size="sm" variant="secondary" className="w-full mt-4 gap-1.5">
              Learn More
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}

function AnimalListCard({ animal }: { animal: Animal }) {
  return (
    <article className="group flex flex-col md:flex-row overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:shadow-xl hover:border-primary/20">
      <div className="relative w-full md:w-64 shrink-0 aspect-video md:aspect-square overflow-hidden">
        <Image
          src={animal.image}
          alt={animal.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <span className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm",
            statusColors[animal.conservationStatus]
          )}>
            {animal.conservationStatus}
          </span>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground italic">{animal.scientificName}</p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{animal.name}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {animal.exhibit}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Feeding: {animal.feedingTime}
              </span>
            </div>
          </div>
          <button className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-red-500 transition-colors">
            <Heart className="h-5 w-5" />
          </button>
        </div>
        
        <p className="mt-4 text-muted-foreground line-clamp-2">{animal.description}</p>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Diet</span>
            <span className="font-medium">{animal.diet}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Lifespan</span>
            <span className="font-medium">{animal.lifespan}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Weight</span>
            <span className="font-medium">{animal.weight}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Region</span>
            <span className="font-medium">{animal.region}</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
          <p className="text-sm text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
            <span><strong>Fun Fact:</strong> {animal.funFact}</span>
          </p>
        </div>

        <div className="mt-auto pt-4 flex justify-end">
          <Button className="gap-1.5">
            Learn More
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  )
}
