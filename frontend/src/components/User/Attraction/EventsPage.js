import React, { useEffect, useState } from 'react';
import eventService from '../../../services/eventService';
import './EventsPage.css';
import { API_BASE_URL } from '../../../services/apiClient';
import { Calendar, Clock, Filter, Grid3X3, List as ListIcon, MapPin, Search, Star, Tag, Ticket, Users } from 'lucide-react';

const CATEGORIES = ["All Events", "Family", "Education", "Special", "Seasonal", "Members Only"];

// Custom cn utility for Tailwind
const cn = (...classes) => classes.filter(Boolean).join(' ');

// Minimal generic components to mimic shadcn/ui
const Button = ({ children, variant = 'default', size = 'default', className, ...props }) => {
  const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none ring-offset-background cursor-pointer";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-border bg-background hover:bg-secondary hover:text-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  };
  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md text-sm",
    icon: "h-10 w-10",
  };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props}>{children}</button>;
};

const Input = ({ className, ...props }) => {
  return <input className={cn("flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />;
};

const CATEGORY_EMOJI = {
  'Family':      '🦒',
  'Education':   '🦁',
  'Special':     '🦁',
  'Seasonal':    '🦩',
  'Members Only':'🐘',
};

function enrichEvent(ev, index) {
  const categories = ['Family', 'Special', 'Seasonal', 'Family', 'Education', 'Members Only'];
  const spotsLeft  = [12, 48, 500, 6, 80, 22];
  const spotsTotal = [30, 100, 500, 12, 200, 40];
  const prices     = [75, 45, 0, 120, 0, 35];
  const featured   = [true, false, true, false, false, false];

  return {
    ...ev,
    title: ev.name || 'Untitled Event',
    image: ev.imageUrl ? `${ev.imageUrl}` : '',
    date: ev.date || new Date().toISOString(),
    time: (ev.startTime || ev.time) ? `${ev.startTime || ev.time}${ev.endTime ? ' - ' + ev.endTime : ''}` : 'TBD',
    location: ev.exhibit || ev.location || 'Zoo-wide',
    category  : categories[index % categories.length],
    spotsLeft : spotsLeft[index % spotsLeft.length],
    totalSpots: spotsTotal[index % spotsTotal.length],
    price: prices[index % prices.length],
    featured  : featured[index % featured.length],
    description: ev.description || `Join us for an unforgettable wildlife experience at the zoo!`,
    includes: ["Expert guide", "Photo opportunity", "Behind-the-scenes", "Complimentary snack"].slice(0, 2 + (index % 3))
  };
}

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function FeaturedEventCard({ event }) {
  const spotsPercentage = (event.spotsLeft / event.totalSpots) * 100
  const isAlmostFull = spotsPercentage < 20

  const emoji = CATEGORY_EMOJI[event.category] || '🎉';

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:shadow-xl hover:border-primary/20 flex flex-col h-full">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {event.image && !event.image.includes('undefined') ? (
            <img
            src={event.image}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
        ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl bg-secondary/50">{emoji}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.9)] via-[rgba(0,0,0,0.4)] to-transparent" />
        
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground shadow-sm">
            <Star className="h-3 w-3 fill-current" />
            Featured
          </span>
          <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
            {event.category}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          <div className="flex items-center gap-2 text-xs text-white/90 mb-2">
            <Calendar className="h-3 w-3" />
            {formatDate(event.date)}
            <span className="text-white/40">|</span>
            <Clock className="h-3 w-3" />
            {event.time}
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight m-0">{event.title}</h3>
          <p className="mt-2 text-sm text-white/70 line-clamp-2 m-0">{event.description}</p>
        </div>
      </div>

      <div className="p-5 border-t border-border flex flex-col flex-1 pb-6 relative z-20 bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-4">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="text-right shrink-0">
            {event.price === 0 ? (
              <span className="text-lg font-bold text-primary">Free</span>
            ) : (
              <span className="text-lg font-bold">${event.price}</span>
            )}
            <span className="text-xs text-muted-foreground">/person</span>
          </div>
        </div>

        <div className="mb-4 mt-auto">
          <div className="flex items-center justify-between text-xs mb-1.5">
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

        <Button className="w-full gap-2 mt-2 h-10">
          <Ticket className="h-4 w-4" />
          Book Now
        </Button>
      </div>
    </article>
  )
}

function EventGridCard({ event }) {
  const spotsPercentage = (event.spotsLeft / event.totalSpots) * 100
  const isAlmostFull = spotsPercentage < 20
  const emoji = CATEGORY_EMOJI[event.category] || '🎉';

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:shadow-xl hover:border-primary/20 h-full">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {event.image && !event.image.includes('undefined') ? (
            <img
            src={event.image}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
        ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl bg-secondary/50">{emoji}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.8)] via-transparent to-transparent" />
        
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium shadow-sm">
            {event.category}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="flex items-center gap-2 text-xs text-white/90">
            <Calendar className="h-3 w-3" />
            {formatDate(event.date)}
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 relative z-20 bg-card">
        <h3 className="font-semibold text-foreground tracking-tight m-0 line-clamp-1">{event.title}</h3>
        
        <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3 shrink-0" />
            {event.time.split(" - ")[0]}
          </span>
          <span className="flex items-center gap-1 min-w-0">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1 truncate">{event.location}</span>
          </span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-5">
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

        <Button className="w-full mt-4 h-9" size="sm">
          Book Now
        </Button>
      </div>
    </article>
  )
}

function EventListCard({ event }) {
  const spotsPercentage = (event.spotsLeft / event.totalSpots) * 100
  const isAlmostFull = spotsPercentage < 20
  const emoji = CATEGORY_EMOJI[event.category] || '🎉';

  return (
    <article className="group flex flex-col md:flex-row overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:shadow-xl hover:border-primary/20">
      <div className="relative w-full md:w-72 shrink-0 aspect-video md:aspect-auto overflow-hidden bg-muted">
        {event.image && !event.image.includes('undefined') ? (
            <img
            src={event.image}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
        ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl bg-secondary/50">{emoji}</div>
        )}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium shadow-sm">
            {event.category}
          </span>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col p-6 relative z-20 bg-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
              <span className="flex items-center gap-1.5 shrink-0">
                <Calendar className="h-4 w-4" />
                {formatDate(event.date)}
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                <Clock className="h-4 w-4" />
                {event.time}
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground m-0">{event.title}</h3>
            <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            {event.price === 0 ? (
              <span className="text-xl font-bold text-primary block">Free</span>
            ) : (
              <>
                <span className="text-xl font-bold block">${event.price}</span>
                <span className="text-sm text-muted-foreground">/person</span>
              </>
            )}
          </div>
        </div>
        
        <p className="mt-4 text-muted-foreground line-clamp-2 m-0 leading-relaxed text-sm">{event.description}</p>

        <div className="flex flex-wrap items-center gap-2 mt-5">
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

        <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className={cn(
              "text-sm font-medium",
              isAlmostFull ? "text-destructive" : "text-muted-foreground"
            )}>
              {isAlmostFull ? `Only ${event.spotsLeft} spots left!` : `${event.spotsLeft} spots available`}
            </span>
          </div>
          <Button className="gap-2 h-9">
            <Ticket className="h-4 w-4" />
            Book Now
          </Button>
        </div>
      </div>
    </article>
  )
}

const EventsPage = () => {
  const [events, setEvents]           = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("All Events");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await eventService.getAllEvents();
        setEvents(Array.isArray(data) ? data.map(enrichEvent) : []);
      } catch {
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesCategory = selectedCategory === "All Events" || event.category === selectedCategory
    const matchesSearch = (event.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.location || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // The original component showed Featured first, then Upcoming. 
  // Let's reproduce that mapping.
  const featuredEvents = filteredEvents.filter(e => e.featured)
  const upcomingEvents = filteredEvents.filter(e => !e.featured)

  return (
    <div className="min-h-screen bg-background pb-12">
      
      {/* Hero Section */}
      <section className="relative">
        <div className="relative h-[45vh] min-h-[360px] overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1541334057884-297eb04ec21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            alt="Zoo events"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(0,0,0,0.6)] via-[rgba(0,0,0,0.4)] to-background" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4 mt-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight text-balance m-0">
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
      <section className="sticky top-[4rem] z-40 bg-card border-b border-border" style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)' }}>
        <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* LEFT: Search + Filter */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative w-full min-w-0 md:min-w-[336px] md:max-w-[480px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" style={{ width: '1.125rem', height: '1.125rem' }} />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  style={{
                    height: '2.75rem',
                    paddingLeft: '2.75rem',
                    paddingRight: '1rem',
                    fontSize: '0.9375rem',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <button
                className="inline-flex items-center justify-center shrink-0 rounded-xl border border-border bg-background text-foreground cursor-pointer hover:bg-secondary transition-colors"
                style={{
                  height: '2.75rem',
                  width: '2.75rem',
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
                }}
              >
                <Filter style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>

            {/* RIGHT: Category Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>{`.flex.items-center.gap-2.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  className={cn(
                    "inline-flex whitespace-nowrap items-center shrink-0 rounded-lg border cursor-pointer transition-all text-sm font-medium",
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-secondary"
                  )}
                  style={{ height: '2.25rem', padding: '0 0.875rem' }}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-32 text-muted-foreground">Loading events...</div>
      ) : (
        <>
          {/* Featured Events */}
          {(featuredEvents.length > 0 && selectedCategory === "All Events") && (
            <section className="mx-auto max-w-7xl px-4 pt-12 lg:px-8">
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-5 w-5 text-accent fill-accent" />
                <h2 className="text-2xl font-bold tracking-tight m-0">Featured Events</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredEvents.map((event) => (
                  <FeaturedEventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Results Count Header */}
          {upcomingEvents.length > 0 && (
            <section className="mx-auto max-w-7xl px-4 pt-12 lg:px-8">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-8">
                <h2 className="text-2xl font-bold tracking-tight m-0">Upcoming Events</h2>
                <p className="text-sm text-muted-foreground m-0">
                  Showing <span className="font-medium text-foreground">{upcomingEvents.length}</span> events
                </p>
              </div>
            </section>
          )}

          {/* Events Grid/List */}
          <section className="mx-auto max-w-7xl px-4 pb-8 lg:px-8">
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
              <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-2xl border border-border mt-8">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold m-0">No events found</h3>
                <p className="text-muted-foreground mt-1 mb-0">Try adjusting your search or filters</p>
              </div>
            )}
          </section>
        </>
      )}

      {/* Newsletter Section */}
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8 mb-4">
        <div className="relative overflow-hidden rounded-3xl bg-[#285c34] p-8 md:p-10 lg:p-12">
          <div className="relative z-10 max-w-[600px]">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight m-0">
              Never Miss an Event
            </h2>
            <p className="mt-4 text-white/90 leading-relaxed text-sm md:text-base pr-4">
              Subscribe to our newsletter and be the first to know about upcoming events,
              exclusive member previews, and special offers.
            </p>
            <form className="mt-8 flex flex-col sm:flex-row gap-4 max-w-md" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email"
                placeholder="Enter your email" 
                className="flex-[2] rounded-md bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 h-10 md:h-11 text-sm md:text-base"
                required
              />
              <button 
                type="submit" 
                className="shrink-0 rounded-md bg-[#f4ece1] text-[#2c2c2c] hover:bg-[#e3dcd1] px-5 py-2.5 font-semibold transition-colors h-10 md:h-11 border-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 text-sm md:text-base"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

    </div>
  );
};

export default EventsPage;
