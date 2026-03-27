import { useEffect, useMemo, useState } from 'react';
import eventService from '../../../services/eventService';
import './EventsPage.css';
import { API_BASE_URL } from '../../../services/apiClient';
import { Calendar, Clock, ChevronLeft, ChevronRight, MapPin, Search, Star, Ticket, Users } from 'lucide-react';
import EventCheckoutModal from './EventCheckoutModal';
import eventsHeroImg from '../../../assets/images/events-hero1.jpg';

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


const CATEGORY_EMOJI = {
  'Family':      '🦒',
  'Education':   '🦁',
  'Special':     '🦁',
  'Seasonal':    '🦩',
  'Members Only':'🐘',
};

function fmt12(t) {
  if (!t) return '';
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return t;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return mStr && mStr !== '00' ? `${h12}:${mStr} ${period}` : `${h12} ${period}`;
}

function enrichEvent(ev) {
  const capacity = ev.capacity || 50;
  const spotsBooked = ev.spotsBooked != null ? Number(ev.spotsBooked) : 0;
  const spotsLeft = Math.max(0, capacity - spotsBooked);

  return {
    ...ev,
    title: ev.name || 'Untitled Event',
    image: ev.imageUrl ? `${API_BASE_URL}${ev.imageUrl}` : '',
    date: ev.date ? ev.date.split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: ev.endDate || '',
    time: (ev.startTime || ev.time) ? `${fmt12(ev.startTime || ev.time)}${ev.endTime ? ' – ' + fmt12(ev.endTime) : ''}` : 'TBD',
    location: ev.exhibit || ev.location || 'Zoo-wide',
    category: ev.category || '',
    spotsLeft,
    totalSpots: capacity,
    price: ev.price || 0,
    featured: ev.isFeatured || false,
    description: ev.description || '',
  };
}


const parseLocalDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatDateRange = (startStr, endStr) => {
  if (!startStr) return '';
  const start = parseLocalDate(startStr);
  if (!endStr || endStr === startStr) {
    return start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }
  const end = parseLocalDate(endStr);
  // Same month: "Mar 1 – 31"
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.getDate()}`;
  }
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function FeaturedEventCard({ event, onBookNow }) {
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
            {formatDateRange(event.date, event.endDate)}
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

        <Button className="w-full gap-2 mt-2 h-10" onClick={() => onBookNow(event)}>
          <Ticket className="h-4 w-4" />
          Book Now
        </Button>
      </div>
    </article>
  )
}

function EventGridCard({ event, onBookNow }) {
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
            {formatDateRange(event.date, event.endDate)}
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

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={cn("font-medium", isAlmostFull ? "text-destructive" : "text-muted-foreground")}>
              {isAlmostFull ? "Almost full!" : `${event.spotsLeft} spots left`}
            </span>
            <span className="text-muted-foreground">{event.totalSpots} total</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", isAlmostFull ? "bg-destructive" : "bg-primary")}
              style={{ width: `${100 - spotsPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div>
            {event.price === 0 ? (
              <span className="font-bold text-primary">Free</span>
            ) : (
              <span className="font-bold">${event.price}</span>
            )}
          </div>
          <Button className="h-9 gap-1.5" size="sm" onClick={() => onBookNow(event)}>
            <Ticket className="h-3.5 w-3.5" />
            Book Now
          </Button>
        </div>
      </div>
    </article>
  )
}

function EventListCard({ event, onBookNow }) {
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
                {formatDateRange(event.date, event.endDate)}
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
        
        <div className="mt-5 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className={cn("font-medium flex items-center gap-1.5", isAlmostFull ? "text-destructive" : "text-muted-foreground")}>
              <Users className="h-3.5 w-3.5" />
              {isAlmostFull ? `Only ${event.spotsLeft} spots left!` : `${event.spotsLeft} spots available`}
            </span>
            <span className="text-muted-foreground">{event.totalSpots} total</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", isAlmostFull ? "bg-destructive" : "bg-primary")}
              style={{ width: `${100 - spotsPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end mt-5">
          <Button className="gap-2 h-9" onClick={() => onBookNow(event)}>
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
  const [viewMode] = useState("grid");
  const [isLoading, setIsLoading]     = useState(true);
  const [checkoutEvent, setCheckoutEvent] = useState(null);
  const [categoryPage, setCategoryPage] = useState(0);
  const [animKey, setAnimKey]   = useState(0);
  const [animDir, setAnimDir]   = useState('right');
  const CAT_PAGE_SIZE = 3;

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const data = await eventService.getAllEvents();
      setEvents(Array.isArray(data) ? data.map(ev => enrichEvent(ev)) : []);
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const cats = events.map(e => e.category).filter(Boolean);
    const unique = [...new Set(cats)].sort();
    return ["All Events", ...unique];
  }, [events]);

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
        <div className="events-hero-frame relative overflow-hidden">
          
          {/* Hero Image */}
          <img
            src={eventsHeroImg}
            alt="Zoo events"
            className="events-hero-img absolute inset-0 w-full h-full"
          />

          {/* Gradient Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 50%, rgb(15, 15, 15) 100%)'
            }}
          />

          {/* Content */}
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
            {/* LEFT: Search */}
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
            </div>

            {/* RIGHT: Category Filters — paginated 3 at a time */}
            <div className="ev-cat-scroll-wrapper">
              <button
                className={`ev-scroll-arrow${categoryPage === 0 ? ' ev-scroll-hidden' : ''}`}
                onClick={() => { setCategoryPage(p => p - 1); setAnimDir('left'); setAnimKey(k => k + 1); }}
                aria-label="Previous categories"
              >
                <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
              </button>

              <div key={animKey} className={`ev-cat-filters ev-slide-${animDir}`}>
                {categories
                  .slice(categoryPage * CAT_PAGE_SIZE, categoryPage * CAT_PAGE_SIZE + CAT_PAGE_SIZE)
                  .map((category) => (
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

              <button
                className={`ev-scroll-arrow${categoryPage >= Math.ceil(categories.length / CAT_PAGE_SIZE) - 1 ? ' ev-scroll-hidden' : ''}`}
                onClick={() => { setCategoryPage(p => p + 1); setAnimDir('right'); setAnimKey(k => k + 1); }}
                aria-label="Next categories"
              >
                <ChevronRight style={{ width: '1rem', height: '1rem' }} />
              </button>
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
          {featuredEvents.length > 0 && (
            <section className="mx-auto max-w-7xl px-4 pt-12 lg:px-8">
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-5 w-5 text-accent fill-accent" />
                <h2 className="text-2xl font-bold tracking-tight m-0">Featured Events</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredEvents.map((event) => (
                  <FeaturedEventCard key={event.id} event={event} onBookNow={setCheckoutEvent} />
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
                  <EventGridCard key={event.id} event={event} onBookNow={setCheckoutEvent} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {upcomingEvents.map((event) => (
                  <EventListCard key={event.id} event={event} onBookNow={setCheckoutEvent} />
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

      {checkoutEvent && (
        <EventCheckoutModal
          isOpen={!!checkoutEvent}
          onClose={() => setCheckoutEvent(null)}
          event={checkoutEvent}
          onOrderPlaced={() => { setCheckoutEvent(null); loadEvents(); }}
        />
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
