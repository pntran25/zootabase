"use client"

import { useState } from "react"
import Image from "next/image"
import { Calendar, ChevronLeft, ChevronRight, Clock, Filter, Grid3X3, List, MapPin, Search, Star, Tag, Ticket, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

const categories = ["All Events", "Family", "Education", "Special", "Seasonal", "Members Only"]

const events = [
  {
    id: 1,
    title: "Breakfast with the Giraffes",
    image: "/images/giraffe.jpg",
    date: "2026-03-21",
    time: "8:00 AM - 10:00 AM",
    location: "Giraffe Heights",
    category: "Family",
    price: 75,
    spotsLeft: 12,
    totalSpots: 30,
    featured: true,
    description: "Start your day with an unforgettable experience! Enjoy a gourmet breakfast while our friendly giraffes join you at eye level.",
    includes: ["Gourmet breakfast", "Giraffe feeding", "Photo opportunity", "Keepsake"],
  },
  {
    id: 2,
    title: "Night Safari Adventure",
    image: "/images/lion.jpg",
    date: "2026-03-22",
    time: "7:00 PM - 10:00 PM",
    location: "Zoo-wide",
    category: "Special",
    price: 45,
    spotsLeft: 48,
    totalSpots: 100,
    featured: true,
    description: "Experience the zoo after dark! Discover the nocturnal behaviors of our animals with expert guides leading the way.",
    includes: ["Guided tour", "Night vision equipment", "Hot cocoa", "Souvenir flashlight"],
  },
  {
    id: 3,
    title: "Junior Zookeeper Camp",
    image: "/images/elephant.jpg",
    date: "2026-03-25",
    time: "9:00 AM - 3:00 PM",
    location: "Education Center",
    category: "Education",
    price: 120,
    spotsLeft: 5,
    totalSpots: 20,
    featured: false,
    description: "A full day of hands-on animal care experience for kids ages 8-12. Learn what it takes to be a real zookeeper!",
    includes: ["Animal feeding", "Behind-the-scenes access", "Lunch included", "Certificate"],
  },
  {
    id: 4,
    title: "Spring Wildlife Photography Workshop",
    image: "/images/tiger.jpg",
    date: "2026-03-28",
    time: "6:00 AM - 11:00 AM",
    location: "Various Exhibits",
    category: "Education",
    price: 95,
    spotsLeft: 8,
    totalSpots: 15,
    featured: false,
    description: "Capture stunning wildlife photos with guidance from professional photographers during golden hour lighting.",
    includes: ["Expert instruction", "Early access", "Photo critique session", "Digital guide"],
  },
  {
    id: 5,
    title: "Easter Egg-stravaganza",
    image: "/images/flamingo.jpg",
    date: "2026-04-05",
    time: "10:00 AM - 4:00 PM",
    location: "Zoo-wide",
    category: "Seasonal",
    price: 0,
    spotsLeft: 500,
    totalSpots: 500,
    featured: true,
    description: "Join us for our annual Easter celebration! Egg hunts, bunny meet-and-greets, and special animal presentations.",
    includes: ["Egg hunt participation", "Bunny photos", "Face painting", "Animal shows"],
  },
  {
    id: 6,
    title: "Members Exclusive: Penguin Encounter",
    image: "/images/penguin.jpg",
    date: "2026-03-29",
    time: "2:00 PM - 3:30 PM",
    location: "Penguin Cove",
    category: "Members Only",
    price: 35,
    spotsLeft: 6,
    totalSpots: 12,
    featured: false,
    description: "An intimate experience exclusive to zoo members. Get up close with our penguin colony and assist with feeding.",
    includes: ["Penguin interaction", "Feeding participation", "Behind-the-scenes tour", "Photo package"],
  },
  {
    id: 7,
    title: "Sunset Yoga at the Zoo",
    image: "/images/hero-wildlife.jpg",
    date: "2026-03-30",
    time: "5:30 PM - 7:00 PM",
    location: "African Savanna Overlook",
    category: "Special",
    price: 25,
    spotsLeft: 22,
    totalSpots: 40,
    featured: false,
    description: "Unwind with a peaceful yoga session overlooking the savanna as the sun sets. All skill levels welcome.",
    includes: ["Yoga mat provided", "Guided meditation", "Refreshments", "Savanna views"],
  },
  {
    id: 8,
    title: "Conservation Talks: Saving Big Cats",
    image: "/images/snow-leopard.jpg",
    date: "2026-04-02",
    time: "11:00 AM - 12:30 PM",
    location: "Conservation Hall",
    category: "Education",
    price: 0,
    spotsLeft: 75,
    totalSpots: 100,
    featured: false,
    description: "Learn about global efforts to protect endangered big cats from our expert conservationists and field researchers.",
    includes: ["Expert presentation", "Q&A session", "Conservation materials", "Donation opportunity"],
  },
  {
    id: 9,
    title: "Gorilla Family Day",
    image: "/images/gorilla.jpg",
    date: "2026-04-12",
    time: "10:00 AM - 2:00 PM",
    location: "Tropical Rainforest",
    category: "Family",
    price: 15,
    spotsLeft: 60,
    totalSpots: 80,
    featured: false,
    description: "A special day dedicated to our gorilla family! Meet the keepers, learn about gorilla conservation, and enjoy themed activities.",
    includes: ["Keeper talk", "Craft activities", "Face painting", "Gorilla-themed snacks"],
  },
  {
    id: 10,
    title: "Wine & Wildlife Evening",
    image: "/images/zebra.jpg",
    date: "2026-04-18",
    time: "6:00 PM - 9:00 PM",
    location: "African Savanna",
    category: "Special",
    price: 85,
    spotsLeft: 30,
    totalSpots: 50,
    featured: true,
    description: "An adults-only evening featuring wine tastings, gourmet appetizers, and exclusive animal encounters as the sun sets.",
    includes: ["Wine tasting", "Gourmet appetizers", "Animal encounters", "Live music"],
  },
]

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

const getMonthYear = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All Events")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)

  const filteredEvents = events.filter((event) => {
    const matchesCategory = selectedCategory === "All Events" || event.category === selectedCategory
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const featuredEvents = filteredEvents.filter(e => e.featured)
  const upcomingEvents = filteredEvents.filter(e => !e.featured)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-16">
        <div className="relative h-[40vh] min-h-[320px] overflow-hidden">
          <Image
            src="/images/events-hero.jpg"
            alt="Zoo events"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-background" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight text-balance">
                Events & Experiences
              </h1>
              <p className="mt-4 text-lg md:text-xl text-white/80 max-w-2xl mx-auto text-balance">
                Create unforgettable memories with unique wildlife encounters
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
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="shrink-0 md:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              {/* Category Filters */}
              <div className={cn(
                "flex items-center gap-2 overflow-x-auto pb-1 md:pb-0",
                showFilters ? "flex" : "hidden md:flex"
              )}>
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
          </div>
        </div>
      </section>

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-5 w-5 text-accent fill-accent" />
            <h2 className="text-2xl font-bold tracking-tight">Featured Events</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredEvents.map((event) => (
              <FeaturedEventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Results Count */}
      <section className="mx-auto max-w-7xl px-4 pt-12 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Upcoming Events</h2>
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{upcomingEvents.length}</span> events
          </p>
        </div>
      </section>

      {/* Events Grid/List */}
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {upcomingEvents.map((event) => (
              <EventGridCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {upcomingEvents.map((event) => (
              <EventListCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No events found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </section>

      {/* Newsletter Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 md:p-12">
          <div className="relative z-10 max-w-xl">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground tracking-tight">
              Never Miss an Event
            </h2>
            <p className="mt-3 text-primary-foreground/80">
              Subscribe to our newsletter and be the first to know about upcoming events, exclusive member previews, and special offers.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Input 
                placeholder="Enter your email" 
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
              />
              <Button variant="secondary" className="shrink-0">
                Subscribe
              </Button>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/2 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-foreground to-transparent" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

interface Event {
  id: number
  title: string
  image: string
  date: string
  time: string
  location: string
  category: string
  price: number
  spotsLeft: number
  totalSpots: number
  featured: boolean
  description: string
  includes: string[]
}

function FeaturedEventCard({ event }: { event: Event }) {
  const spotsPercentage = (event.spotsLeft / event.totalSpots) * 100
  const isAlmostFull = spotsPercentage < 20

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:shadow-xl hover:border-primary/20">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
        
        {/* Featured badge */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
            <Star className="h-3 w-3 fill-current" />
            Featured
          </span>
          <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-foreground">
            {event.category}
          </span>
        </div>

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 text-xs text-white/80 mb-2">
            <Calendar className="h-3 w-3" />
            {formatDate(event.date)}
            <span className="text-white/40">|</span>
            <Clock className="h-3 w-3" />
            {event.time}
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">{event.title}</h3>
          <p className="mt-2 text-sm text-white/70 line-clamp-2">{event.description}</p>
        </div>
      </div>

      <div className="p-5 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {event.location}
          </div>
          <div className="text-right">
            {event.price === 0 ? (
              <span className="text-lg font-bold text-primary">Free</span>
            ) : (
              <span className="text-lg font-bold">${event.price}</span>
            )}
            <span className="text-xs text-muted-foreground">/person</span>
          </div>
        </div>

        {/* Spots indicator */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={cn(
              "font-medium",
              isAlmostFull ? "text-destructive" : "text-muted-foreground"
            )}>
              {isAlmostFull ? "Almost full!" : `${event.spotsLeft} spots left`}
            </span>
            <span className="text-muted-foreground">{event.totalSpots} total</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all",
                isAlmostFull ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${100 - spotsPercentage}%` }}
            />
          </div>
        </div>

        <Button className="w-full gap-2">
          <Ticket className="h-4 w-4" />
          Book Now
        </Button>
      </div>
    </article>
  )
}

function EventGridCard({ event }: { event: Event }) {
  const spotsPercentage = (event.spotsLeft / event.totalSpots) * 100
  const isAlmostFull = spotsPercentage < 20

  return (
    <article className="group overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:shadow-xl hover:border-primary/20">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
        
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium">
            {event.category}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2 text-xs text-white/80">
            <Calendar className="h-3 w-3" />
            {formatDate(event.date)}
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground tracking-tight line-clamp-1">{event.title}</h3>
        
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {event.time.split(" - ")[0]}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {event.location}
          </span>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div>
            {event.price === 0 ? (
              <span className="font-bold text-primary">Free</span>
            ) : (
              <span className="font-bold">${event.price}</span>
            )}
          </div>
          <span className={cn(
            "text-xs font-medium",
            isAlmostFull ? "text-destructive" : "text-muted-foreground"
          )}>
            {event.spotsLeft} spots left
          </span>
        </div>

        <Button className="w-full mt-4" size="sm">
          Book Now
        </Button>
      </div>
    </article>
  )
}

function EventListCard({ event }: { event: Event }) {
  const spotsPercentage = (event.spotsLeft / event.totalSpots) * 100
  const isAlmostFull = spotsPercentage < 20

  return (
    <article className="group flex flex-col md:flex-row overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:shadow-xl hover:border-primary/20">
      <div className="relative w-full md:w-72 shrink-0 aspect-video md:aspect-auto overflow-hidden">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium">
            {event.category}
          </span>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(event.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {event.time}
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">{event.title}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {event.location}
            </div>
          </div>
          <div className="text-right shrink-0">
            {event.price === 0 ? (
              <span className="text-xl font-bold text-primary">Free</span>
            ) : (
              <>
                <span className="text-xl font-bold">${event.price}</span>
                <span className="text-sm text-muted-foreground">/person</span>
              </>
            )}
          </div>
        </div>
        
        <p className="mt-3 text-muted-foreground line-clamp-2">{event.description}</p>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {event.includes.slice(0, 3).map((item) => (
            <span key={item} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
              <Tag className="h-3 w-3" />
              {item}
            </span>
          ))}
          {event.includes.length > 3 && (
            <span className="text-xs text-muted-foreground">+{event.includes.length - 3} more</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className={cn(
              "text-sm font-medium",
              isAlmostFull ? "text-destructive" : "text-muted-foreground"
            )}>
              {isAlmostFull ? `Only ${event.spotsLeft} spots left!` : `${event.spotsLeft} spots available`}
            </span>
          </div>
          <Button className="gap-2">
            <Ticket className="h-4 w-4" />
            Book Now
          </Button>
        </div>
      </div>
    </article>
  )
}
