import Link from "next/link"
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react"

const footerLinks = {
  visit: [
    { label: "Hours & Admission", href: "#" },
    { label: "Getting Here", href: "#" },
    { label: "Accessibility", href: "#" },
    { label: "Zoo Map", href: "#" },
    { label: "FAQ", href: "#" },
  ],
  explore: [
    { label: "Exhibits", href: "#" },
    { label: "Animals", href: "#" },
    { label: "Events", href: "#" },
    { label: "Dining", href: "#" },
    { label: "Gift Shop", href: "#" },
  ],
  support: [
    { label: "Membership", href: "#" },
    { label: "Donate", href: "#" },
    { label: "Adopt an Animal", href: "#" },
    { label: "Volunteer", href: "#" },
    { label: "Corporate Partners", href: "#" },
  ],
  about: [
    { label: "Our Mission", href: "#" },
    { label: "Conservation", href: "#" },
    { label: "Research", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
  ],
}

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Youtube, href: "#", label: "YouTube" },
]

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <span className="text-lg font-bold text-primary-foreground">W</span>
              </div>
              <span className="text-xl font-bold tracking-tight">Wildwood Zoo</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-background/70 leading-relaxed">
              Connecting people with wildlife and inspiring conservation action since 1965.
            </p>
            <div className="mt-6 flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-background/70 transition-colors hover:bg-background/20 hover:text-background"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-background/50">
              Visit
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.visit.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/70 transition-colors hover:text-background"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-background/50">
              Explore
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/70 transition-colors hover:text-background"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-background/50">
              Support
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/70 transition-colors hover:text-background"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-background/50">
              About
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/70 transition-colors hover:text-background"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-background/10 pt-8 md:flex-row">
          <p className="text-sm text-background/50">
            © 2026 Wildwood Zoo. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-background/50 hover:text-background">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-background/50 hover:text-background">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm text-background/50 hover:text-background">
              Cookie Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
