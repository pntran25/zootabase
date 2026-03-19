"use client"

import Image from "next/image"
import { ArrowRight, Clock, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExhibitCardProps {
  title: string
  description: string
  image: string
  location: string
  hours: string
  featured?: boolean
}

export function ExhibitCard({
  title,
  description,
  image,
  location,
  hours,
  featured = false,
}: ExhibitCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-card transition-all duration-500 hover:shadow-2xl",
        featured ? "md:col-span-2 md:row-span-2" : ""
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 text-card">
        <div className="mb-3 flex items-center gap-4 text-sm text-card/80">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {location}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {hours}
          </span>
        </div>
        
        <h3 className={cn(
          "font-semibold tracking-tight text-balance",
          featured ? "text-3xl" : "text-xl"
        )}>
          {title}
        </h3>
        
        <p className={cn(
          "mt-2 line-clamp-2 text-card/80",
          featured ? "text-base" : "text-sm"
        )}>
          {description}
        </p>
        
        <button className="mt-4 flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-accent/80">
          Explore Exhibit
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  )
}
