"use client"

import Image from "next/image"
import { ArrowDown, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-wildlife.jpg"
          alt="Wildlife at Wildwood Zoo"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 pt-20 lg:px-8">
        <div className="max-w-3xl">
          <span className="mb-4 inline-block rounded-full bg-accent/90 px-4 py-1.5 text-sm font-medium text-accent-foreground">
            Open Daily 9AM - 6PM
          </span>
          
          <h1 className="text-5xl font-bold tracking-tight text-background sm:text-6xl lg:text-8xl">
            <span className="block text-balance">Experience the</span>
            <span className="block text-accent">Wild</span>
          </h1>
          
          <p className="mt-6 max-w-xl text-lg text-background/90 leading-relaxed">
            Journey through immersive habitats and connect with over 500 species from around the world. Conservation, education, and adventure await.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button size="lg" className="h-14 px-8 text-base">
              Plan Your Visit
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 text-base bg-background/10 border-background/30 text-background hover:bg-background/20"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Video
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 flex flex-wrap gap-12">
            <div>
              <p className="text-4xl font-bold text-background">500+</p>
              <p className="text-sm text-background/70">Animal Species</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-background">200</p>
              <p className="text-sm text-background/70">Acres of Habitat</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-background">1M+</p>
              <p className="text-sm text-background/70">Annual Visitors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce">
        <a
          href="#exhibits"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-background/20 text-background backdrop-blur-sm transition-colors hover:bg-background/30"
          aria-label="Scroll to exhibits"
        >
          <ArrowDown className="h-5 w-5" />
        </a>
      </div>
    </section>
  )
}
