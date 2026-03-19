"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Ticket, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Home", href: "/" },
  { label: "Exhibits", href: "/exhibits" },
  { label: "Animals", href: "/animals" },
  { label: "Events", href: "/events" },
  { label: "Gift Shop", href: "/gift-shop" },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <span className="text-lg font-bold text-primary-foreground">W</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">Wildwood Zoo</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              Login
            </Button>
          </Link>
          <Link href="/tickets">
            <Button size="sm" className="gap-2">
              <Ticket className="h-4 w-4" />
              Buy Tickets
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 lg:hidden"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300 bg-background border-b border-border",
          isOpen ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="px-4 py-4 flex flex-col gap-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-base font-medium text-foreground"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-4 border-t border-border">
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" className="w-full gap-2 justify-center">
                <User className="h-4 w-4" />
                Login
              </Button>
            </Link>
            <Link href="/tickets" onClick={() => setIsOpen(false)}>
              <Button className="w-full gap-2">
                <Ticket className="h-4 w-4" />
                Buy Tickets
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
