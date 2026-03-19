"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { 
  Accessibility, 
  Baby, 
  Bus, 
  Calendar, 
  Car, 
  ChevronDown, 
  Clock, 
  Coffee, 
  Dog, 
  Download, 
  HelpCircle, 
  Info, 
  MapPin, 
  Phone, 
  Shirt, 
  Ticket, 
  Utensils, 
  Wifi 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

const hours = [
  { day: "Monday", hours: "9:00 AM - 5:00 PM", isToday: false },
  { day: "Tuesday", hours: "9:00 AM - 5:00 PM", isToday: true },
  { day: "Wednesday", hours: "9:00 AM - 5:00 PM", isToday: false },
  { day: "Thursday", hours: "9:00 AM - 5:00 PM", isToday: false },
  { day: "Friday", hours: "9:00 AM - 6:00 PM", isToday: false },
  { day: "Saturday", hours: "8:00 AM - 7:00 PM", isToday: false },
  { day: "Sunday", hours: "8:00 AM - 6:00 PM", isToday: false },
]

const quickPrices = [
  { type: "Adult", age: "13-64", price: 29.99 },
  { type: "Child", age: "3-12", price: 19.99 },
  { type: "Senior", age: "65+", price: 24.99 },
  { type: "Toddler", age: "Under 3", price: 0 },
]

const amenities = [
  { icon: Utensils, name: "Dining", description: "5 restaurants & 12 snack bars" },
  { icon: Wifi, name: "Free WiFi", description: "Available throughout the zoo" },
  { icon: Baby, name: "Family Services", description: "Nursing rooms & changing stations" },
  { icon: Accessibility, name: "Accessibility", description: "Wheelchair rentals available" },
  { icon: Dog, name: "Pet Policy", description: "Service animals only" },
  { icon: Shirt, name: "Gift Shops", description: "4 stores with unique souvenirs" },
]

const faqs = [
  {
    question: "Can I bring outside food and drinks?",
    answer: "Small snacks and water bottles are permitted. Coolers, glass containers, and alcohol are not allowed. We have many dining options available throughout the zoo."
  },
  {
    question: "Are strollers and wheelchairs available for rent?",
    answer: "Yes! Single and double strollers are available for $12-$18/day. Wheelchairs are $15/day and electric scooters are $45/day. Reserve online to guarantee availability."
  },
  {
    question: "What happens if it rains?",
    answer: "The zoo is open rain or shine! Many of our exhibits have indoor viewing areas. If severe weather occurs, you can use your ticket for another visit within 30 days."
  },
  {
    question: "Can I leave and re-enter the zoo?",
    answer: "Yes, same-day re-entry is allowed. Just get your hand stamped at the exit and keep your ticket. Re-entry must be before 4:00 PM."
  },
  {
    question: "Is parking free?",
    answer: "General parking is $15 per vehicle. Members receive free parking. Preferred parking near the entrance is $25. We also offer EV charging stations."
  },
  {
    question: "Are there lockers available?",
    answer: "Yes, lockers are located near the main entrance. Small lockers are $10/day and large lockers are $15/day. Payment is by credit card only."
  },
]

const parkingOptions = [
  { type: "General Parking", price: "$15", description: "Main lot, 5-10 min walk to entrance" },
  { type: "Preferred Parking", price: "$25", description: "Close to entrance, covered available" },
  { type: "EV Charging", price: "$15 + charging", description: "12 Tesla & universal chargers" },
  { type: "Member Parking", price: "Free", description: "All lots, show membership card" },
]

export default function VisitPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/visit-hero.jpg"
          alt="Zoo entrance"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 text-balance">
            Plan Your Visit
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Everything you need for a perfect day at Wildwood Zoo
          </p>
        </div>
      </section>

      {/* Quick Info Cards */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Hours Card */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Hours</h2>
              </div>
              <div className="space-y-2">
                {hours.map((item) => (
                  <div 
                    key={item.day} 
                    className={cn(
                      "flex justify-between text-sm py-1.5 px-2 rounded-lg",
                      item.isToday && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <span>{item.day}</span>
                    <span>{item.hours}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Last entry 1 hour before closing. Hours may vary on holidays.
              </p>
            </div>

            {/* Admission Card */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/30">
                  <Ticket className="h-5 w-5 text-accent-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Admission</h2>
              </div>
              <div className="space-y-3">
                {quickPrices.map((item) => (
                  <div key={item.type} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-foreground">{item.type}</span>
                      <span className="text-sm text-muted-foreground ml-2">({item.age})</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {item.price === 0 ? "Free" : `$${item.price}`}
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/tickets">
                <Button className="w-full mt-4 gap-2">
                  <Ticket className="h-4 w-4" />
                  Buy Tickets
                </Button>
              </Link>
            </div>

            {/* Location Card */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Location</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-foreground">Wildwood Zoo</p>
                  <p className="text-sm text-muted-foreground">
                    1234 Wildlife Drive<br />
                    Wildwood, CA 90210
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>(555) 123-4567</span>
                </div>
                <Button variant="outline" className="w-full gap-2">
                  <MapPin className="h-4 w-4" />
                  Get Directions
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zoo Map Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold text-foreground mb-4">Zoo Map</h2>
              <p className="text-muted-foreground mb-6 text-pretty">
                Navigate our 150-acre park with ease. Download our interactive map or pick up a printed copy at the entrance.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Map (PDF)
                </Button>
                <Button variant="outline" className="gap-2">
                  <Info className="h-4 w-4" />
                  Interactive Map
                </Button>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border shadow-lg">
                <Image
                  src="/images/zoo-map.jpg"
                  alt="Zoo map"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Here Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Getting Here</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* By Car */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">By Car</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                From Highway 101, take Exit 42 (Wildlife Drive). The zoo entrance is 0.5 miles on your right.
              </p>
              <h4 className="font-medium text-foreground mb-3">Parking Options</h4>
              <div className="space-y-3">
                {parkingOptions.map((option) => (
                  <div key={option.type} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{option.type}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    <span className="font-semibold text-primary">{option.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Public Transit */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Bus className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Public Transit</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium text-foreground">Bus Lines</p>
                  <p className="text-sm text-muted-foreground">
                    Routes 42, 56, and 78 stop directly at the zoo entrance. Service runs every 15-20 minutes.
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium text-foreground">Metro Rail</p>
                  <p className="text-sm text-muted-foreground">
                    Take the Green Line to Wildlife Station. Free shuttle bus connects to the zoo every 10 minutes.
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium text-foreground">Rideshare</p>
                  <p className="text-sm text-muted-foreground">
                    Dedicated pickup/dropoff zone at the main entrance. Look for the purple signs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Amenities & Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {amenities.map((amenity) => (
              <div 
                key={amenity.name}
                className="bg-card rounded-xl border border-border p-4 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-3">
                  <amenity.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-1">{amenity.name}</h3>
                <p className="text-xs text-muted-foreground">{amenity.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dining Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/30">
                  <Coffee className="h-5 w-5 text-accent-foreground" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">Dining</h2>
              </div>
              <p className="text-muted-foreground mb-6 text-pretty">
                From quick bites to sit-down restaurants, we have options for every taste and dietary need.
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-card rounded-xl border border-border">
                  <h4 className="font-semibold text-foreground">Safari Grill</h4>
                  <p className="text-sm text-muted-foreground">American classics, burgers, salads</p>
                </div>
                <div className="p-4 bg-card rounded-xl border border-border">
                  <h4 className="font-semibold text-foreground">Bamboo Garden</h4>
                  <p className="text-sm text-muted-foreground">Asian fusion, vegetarian options</p>
                </div>
                <div className="p-4 bg-card rounded-xl border border-border">
                  <h4 className="font-semibold text-foreground">Treetop Cafe</h4>
                  <p className="text-sm text-muted-foreground">Coffee, pastries, light bites</p>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="font-semibold text-foreground mb-4">Dietary Accommodations</h3>
                <div className="flex flex-wrap gap-2">
                  {["Vegetarian", "Vegan", "Gluten-Free", "Kosher", "Halal", "Nut-Free", "Kid-Friendly"].map((diet) => (
                    <span 
                      key={diet}
                      className="px-3 py-1.5 bg-muted rounded-full text-sm text-muted-foreground"
                    >
                      {diet}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  All restaurants offer options for common dietary restrictions. Ask any team member for assistance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-foreground pr-4">{faq.question}</span>
                  <ChevronDown 
                    className={cn(
                      "h-5 w-5 text-muted-foreground shrink-0 transition-transform",
                      openFaq === index && "rotate-180"
                    )}
                  />
                </button>
                <div 
                  className={cn(
                    "overflow-hidden transition-all",
                    openFaq === index ? "max-h-48" : "max-h-0"
                  )}
                >
                  <p className="px-4 pb-4 text-muted-foreground">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready for Your Adventure?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Book your tickets online and save up to 15%. Skip the line and head straight to the animals!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/tickets">
              <Button size="lg" className="gap-2">
                <Ticket className="h-5 w-5" />
                Buy Tickets Now
              </Button>
            </Link>
            <Link href="/events">
              <Button size="lg" variant="outline" className="gap-2">
                <Calendar className="h-5 w-5" />
                View Events
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
