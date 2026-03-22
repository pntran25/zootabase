import { Clock, MapPin, Ticket, Users } from "lucide-react"

const infoItems = [
  {
    icon: Clock,
    label: "Hours Today",
    value: "9:00 AM - 6:00 PM",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "123 Wildlife Way",
  },
  {
    icon: Ticket,
    label: "Adult Tickets",
    value: "From $29.99",
  },
  {
    icon: Users,
    label: "Visitors Today",
    value: "2,847",
  },
]

export function QuickInfo() {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {infoItems.map((item, index) => (
            <div
              key={item.label}
              className={`flex items-center gap-4 px-6 py-5 ${
                index < infoItems.length - 1 ? "border-r border-border" : ""
              } ${index % 2 === 1 ? "border-r-0 lg:border-r" : ""}`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
