import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Check, ChevronLeft, ChevronRight, Clock,
  Gift, Info, Minus, Plus, ShieldCheck, Star, Ticket, Users, Zap
} from 'lucide-react';
import TicketCheckoutModal from './TicketCheckoutModal';
import { apiGet } from '../../../services/apiClient';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getDaysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(month, year) {
  return new Date(year, month, 1).getDay();
}

const TicketingPage = () => {
  const navigate = useNavigate();
  const [ticketTypes, setTicketTypes] = useState([]);
  const [addons, setAddons] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [quantities, setQuantities] = useState({ adult: 2, child: 0, senior: 0 });
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(new Date().getDate() + 1);
  const [isMounted, setIsMounted] = useState(false);
  const [todayDate, setTodayDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    day: new Date().getDate()
  });
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    Promise.all([apiGet('/api/ticket-packages'), apiGet('/api/ticket-addons')])
      .then(([pkgs, ads]) => {
        const mapped = pkgs.map(p => ({
          id: String(p.packageId),
          name: p.name,
          description: p.description,
          prices: { adult: p.adultPrice, child: p.childPrice, senior: p.seniorPrice },
          features: p.features || [],
          popular: p.isMostPopular,
        }));
        setTicketTypes(mapped);
        // Default to "most popular" or first
        const popular = mapped.find(t => t.popular) || mapped[0];
        if (popular) setSelectedTicket(popular.id);
        const ticketAddons = ads.map(a => ({ id: String(a.addonId), name: a.name, price: a.price, description: a.description }));
        setAddons(ticketAddons);
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, []);

  const updateQuantity = (type, delta) => {
    setQuantities(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta)
    }));
  };

  const toggleAddOn = (id) => {
    setSelectedAddOns(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const selectedTicketData = ticketTypes.find(t => t.id === selectedTicket);

  const ticketSubtotal = selectedTicketData
    ? quantities.adult  * selectedTicketData.prices.adult +
      quantities.child  * selectedTicketData.prices.child +
      quantities.senior * selectedTicketData.prices.senior
    : 0;

  const totalGuests = quantities.adult + quantities.child + quantities.senior;

  const addOnsTotal = selectedAddOns.reduce((sum, id) => {
    const addOn = addons.find(a => a.id === id);
    return sum + (addOn ? addOn.price : 0);
  }, 0);

  const total = ticketSubtotal + addOnsTotal;

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  if (dataLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div style={{ textAlign: 'center', color: '#6b7280' }}>
        <Ticket size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
        <p>Loading tickets...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[45vh] min-h-[360px] flex items-center justify-center overflow-hidden">
        <img
          src="/images/tickets-hero.png"
          alt="Zoo Tickets"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(30, 20, 10, 0.65) 0%, rgba(30, 20, 10, 0.4) 50%, rgba(250, 250, 250, 1) 100%)' }} />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Buy Tickets
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Ticket Selection */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Date Selection */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Select Date
                </h2>
                
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button 
                    onClick={() => {
                      if (currentMonth === 0) {
                        setCurrentMonth(11);
                        setCurrentYear(y => y - 1);
                      } else {
                        setCurrentMonth(m => m - 1);
                      }
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-5 w-5 text-foreground" />
                  </button>
                  <span className="font-semibold text-foreground">
                    {MONTHS[currentMonth]} {currentYear}
                  </span>
                  <button 
                    onClick={() => {
                      if (currentMonth === 11) {
                        setCurrentMonth(0);
                        setCurrentYear(y => y + 1);
                      } else {
                        setCurrentMonth(m => m + 1);
                      }
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-5 w-5 text-foreground" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <div key={day} className="text-xs font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {isMounted && Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isPast = currentYear < todayDate.year || 
                      (currentYear === todayDate.year && currentMonth < todayDate.month) ||
                      (currentYear === todayDate.year && currentMonth === todayDate.month && day < todayDate.day);
                    const isSelected = selectedDate === day;
                    
                    return (
                      <button
                        key={day}
                        onClick={() => !isPast && setSelectedDate(day)}
                        disabled={isPast}
                        className={cn(
                          "py-2 rounded-lg text-sm transition-colors",
                          isPast ? "text-muted-foreground/40 cursor-not-allowed border-none bg-transparent" : "cursor-pointer border-none",
                          !isPast && !isSelected ? "hover:bg-muted text-foreground bg-transparent" : "",
                          isSelected ? "bg-primary text-primary-foreground font-medium" : ""
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {selectedDate && (
                  <div className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">
                      {MONTHS[currentMonth]} {selectedDate}, {currentYear} - Zoo open 9:00 AM - 5:00 PM
                    </span>
                  </div>
                )}
              </div>

              {/* Ticket Type Selection */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  Choose Ticket Type
                </h2>
                
                <div className="space-y-4">
                  {ticketTypes.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket.id)}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer bg-card",
                        selectedTicket === ticket.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-[#608B6B]"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground m-0">{ticket.name}</h3>
                            {ticket.popular && (
                              <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-semibold rounded-full flex items-center gap-1">
                                <Star className="h-3 w-3 fill-primary" />
                                Most Popular
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 m-0">{ticket.description}</p>
                        </div>
                        <div className={cn(
                          "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0",
                          selectedTicket === ticket.id 
                            ? "border-primary bg-primary" 
                            : "border-muted-foreground/30 bg-transparent"
                        )}>
                          {selectedTicket === ticket.id && (
                            <Check className="h-4 w-4 text-primary-foreground" />
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-4 text-sm">
                        <span className="text-foreground">
                          Adult: <strong>${ticket.prices.adult}</strong>
                        </span>
                        <span className="text-foreground">
                          Child: <strong>${ticket.prices.child}</strong>
                        </span>
                        <span className="text-foreground">
                          Senior: <strong>${ticket.prices.senior}</strong>
                        </span>
                      </div>

                      {selectedTicket === ticket.id && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-sm font-medium text-foreground mb-2 m-0">Includes:</p>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 m-0 p-0 list-none">
                            {ticket.features.map((feature, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground m-0 mt-1">
                                <Check className="h-4 w-4 text-primary shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest Quantity */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Number of Guests
                </h2>
                
                <div className="space-y-4">
                  {[
                    { key: "adult", label: "Adults", age: "13-64", price: selectedTicketData.prices.adult },
                    { key: "child", label: "Children", age: "3-12", price: selectedTicketData.prices.child },
                    { key: "senior", label: "Seniors", age: "65+", price: selectedTicketData.prices.senior },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                      <div>
                        <p className="font-medium text-foreground m-0">{item.label}</p>
                        <p className="text-sm text-muted-foreground m-0">{item.age} - ${item.price} each</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.key, -1)}
                          className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer bg-card text-foreground"
                          disabled={quantities[item.key] === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-foreground">
                           {quantities[item.key]}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.key, 1)}
                          className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer bg-card text-foreground"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1 m-0">
                  <Info className="h-3 w-3" />
                  Children under 3 are free and don't need a ticket
                </p>
              </div>

              {/* Add-ons */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  Enhance Your Visit
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {addons.map((addOn) => (
                    <button
                      key={addOn.id}
                      onClick={() => toggleAddOn(addOn.id)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-left transition-all cursor-pointer bg-card flex flex-col justify-center",
                        selectedAddOns.includes(addOn.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-[#608B6B]"
                      )}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div>
                          <p className="font-medium text-foreground m-0">{addOn.name}</p>
                          <p className="text-sm text-muted-foreground m-0 mt-1">{addOn.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">+${addOn.price}</span>
                          <div className={cn(
                            "h-5 w-5 rounded border flex items-center justify-center",
                            selectedAddOns.includes(addOn.id)
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/30 bg-transparent"
                          )}>
                            {selectedAddOns.includes(addOn.id) && (
                              <Check className="h-3 w-3 text-primary-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 m-0">
                  Each add-on is added once to your order
                </p>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-[5.5rem] bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-4 m-0">Order Summary</h2>
                
                {selectedDate && (
                  <div className="mb-4 mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground m-0">Visit Date</p>
                    <p className="font-medium text-foreground m-0 mt-1">
                      {MONTHS[currentMonth]} {selectedDate}, {currentYear}
                    </p>
                  </div>
                )}

                <div className="space-y-3 mb-4 mt-4">
                  <div className="flex justify-between">
                    <span className="text-foreground font-medium">{selectedTicketData.name}</span>
                  </div>
                  
                  {quantities.adult > 0 && (
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-muted-foreground">{quantities.adult}x Adult</span>
                      <span className="text-foreground">${(quantities.adult * selectedTicketData.prices.adult).toFixed(2)}</span>
                    </div>
                  )}
                  {quantities.child > 0 && (
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-muted-foreground">{quantities.child}x Child</span>
                      <span className="text-foreground">${(quantities.child * selectedTicketData.prices.child).toFixed(2)}</span>
                    </div>
                  )}
                  {quantities.senior > 0 && (
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-muted-foreground">{quantities.senior}x Senior</span>
                      <span className="text-foreground">${(quantities.senior * selectedTicketData.prices.senior).toFixed(2)}</span>
                    </div>
                  )}

                  {selectedAddOns.length > 0 && (
                    <>
                      <div className="border-t border-border mt-4 mb-4" />
                      <p className="text-sm font-medium text-foreground m-0">Add-ons</p>
                      {selectedAddOns.map(id => {
                        const addOn = addons.find(a => a.id === id);
                        return (
                          <div key={id} className="flex justify-between text-sm mt-2">
                            <span className="text-muted-foreground">{addOn.name}</span>
                            <span className="text-foreground">${addOn.price.toFixed(2)}</span>
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>

                <div className="border-t border-border pt-4 mb-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-right m-0">
                    {totalGuests} guest{totalGuests !== 1 ? "s" : ""}
                  </p>
                </div>

                <button
                  className={cn(
                    "w-full flex items-center justify-center gap-2 mb-4 py-3 rounded-xl font-semibold transition-colors border-none",
                    totalGuests === 0 || !selectedDate
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                  )}
                  disabled={totalGuests === 0 || !selectedDate}
                  onClick={() => setIsCheckoutOpen(true)}
                >
                  <Zap className="h-4 w-4" />
                  Checkout
                </button>

                <div className="space-y-3 text-xs text-muted-foreground mt-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Free rescheduling up to 24h before</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-primary" />
                    <span>Mobile tickets - no printing needed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TicketCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        visitDate={{ month: currentMonth, day: selectedDate, year: currentYear }}
        ticketType={selectedTicketData}
        quantities={quantities}
        prices={selectedTicketData?.prices}
        addOns={selectedAddOns.map(id => addons.find(a => a.id === id)).filter(Boolean)}
        subtotal={ticketSubtotal + addOnsTotal}
        total={total}
        onOrderPlaced={() => setIsCheckoutOpen(false)}
      />

      {/* Member Banner */}
      <section className="py-12 px-4 bg-[#EBF0EA]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2 m-0">Become a Member</h2>
          <p className="text-muted-foreground mb-6 m-0 mt-2">
            Unlimited visits, exclusive events, and up to 20% off at shops and restaurants
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <button onClick={() => navigate('/membership#plans')} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2 cursor-pointer">
              <Star className="h-4 w-4 fill-foreground" />
              View Membership Options
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TicketingPage;
