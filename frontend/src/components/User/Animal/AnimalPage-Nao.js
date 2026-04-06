import { useState, useEffect } from 'react';
import animalService from '../../../services/animalService';
import './AnimalPage.css';
import { API_BASE_URL } from '../../../services/apiClient';
import { Info, MapPin, Search, Grid3X3, List, ChevronLeft, ChevronRight } from 'lucide-react';
import placeholderImg from '../../../assets/images/Exhibits_Images/ExhibitsComingSoon.png';
import tigerHeroImg from '../../../assets/images/tiger.jpg';

// Custom cn utility for Tailwind
const cn = (...classes) => classes.filter(Boolean).join(' ');

// status utility from reference
const statusColors = {
  "Critically Endangered": "bg-red-500/10 text-red-600 border-red-200",
  "Endangered": "bg-orange-500/10 text-orange-600 border-orange-200",
  "Vulnerable": "bg-amber-500/10 text-amber-600 border-amber-200",
  "Near Threatened": "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  "Least Concern": "bg-green-500/10 text-green-600 border-green-200",
  "Default": "bg-gray-500/10 text-gray-600 border-gray-200",
}

function getStatusBadge(health) {
  const h = (health || '').toLowerCase();
  if (h.includes('critical') || h.includes('endangered'))
    return { label: 'Endangered',       cls: statusColors['Endangered'] };
  if (h.includes('fair') || h.includes('vulnerable') || h.includes('checkup'))
    return { label: 'Vulnerable',       cls: statusColors['Vulnerable'] };
  if (h.includes('near'))
    return { label: 'Near Threatened',  cls: statusColors['Near Threatened'] };
  if (h.includes('good') || h.includes('excellent'))
    return { label: 'Least Concern',    cls: statusColors['Least Concern'] };
  return { label: health || 'Unknown',  cls: statusColors['Default'] };
}


const AnimalPage = () => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All Exhibits");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [exhibitPage, setExhibitPage] = useState(0);
  const [animKey, setAnimKey]   = useState(0);
  const [animDir, setAnimDir]   = useState('right');

  const EXHIBIT_PAGE_SIZE = 3;

  const handleViewToggle = () => {
    setViewMode(v => v === 'grid' ? 'list' : 'grid');
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await animalService.getDisplayAnimals();
        setAnimals(data);
      } catch (err) {
        console.error('Error fetching animals:', err);
        setError('Failed to load animals.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center text-lg text-muted-foreground">Loading animals...</div>;
  if (error) return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;

  const dynamicCategories = ["All Exhibits", ...Array.from(new Set(animals.map(a => a.exhibit).filter(Boolean)))];

  const filteredAnimals = animals.filter(animal => {
    const matchesCategory = selectedCategory === "All Exhibits" || animal.exhibit === selectedCategory;
    const searchPart = searchQuery.toLowerCase();
    const matchesSearch =
      (animal.name || "").toLowerCase().includes(searchPart) ||
      (animal.species || "").toLowerCase().includes(searchPart) ||
      (animal.exhibit || "").toLowerCase().includes(searchPart);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background pb-12">
      <section className="relative">
        <div className="relative h-[45vh] min-h-[360px] overflow-hidden">
          <img
            src={tigerHeroImg}
            alt="Zoo animals"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center 40%' }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 50%, rgba(250,250,250,1) 100%)' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4 mt-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight text-balance m-0">
                Meet Our Animals
              </h1>
              <p className="mt-4 text-lg md:text-xl text-white/80 max-w-2xl mx-auto text-balance">
                Discover incredible species entrusted to our care from every corner of the globe
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-[4rem] z-40 bg-card border-b border-border" style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)' }}>
        <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* LEFT: Search + View Toggle */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative w-full min-w-0 md:min-w-[336px] md:max-w-[480px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" style={{ width: '1.125rem', height: '1.125rem' }} />
                <input
                  type="text"
                  placeholder="Search animals by name or exhibit..."
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
                onClick={handleViewToggle}
                title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
              >
                {viewMode === 'grid'
                  ? <List style={{ width: '1rem', height: '1rem' }} />
                  : <Grid3X3 style={{ width: '1rem', height: '1rem' }} />}
              </button>
            </div>

            {/* RIGHT: Exhibit Filters — paginated 3 at a time */}
            <div className="an-exhibit-scroll-wrapper">
              <button
                className={`an-scroll-arrow${exhibitPage === 0 ? ' an-scroll-hidden' : ''}`}
                onClick={() => { setExhibitPage(p => p - 1); setAnimDir('left'); setAnimKey(k => k + 1); }}
                aria-label="Previous exhibits"
              >
                <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
              </button>

              <div key={animKey} className={`an-exhibit-filters an-slide-${animDir}`}>
                {dynamicCategories
                  .slice(exhibitPage * EXHIBIT_PAGE_SIZE, exhibitPage * EXHIBIT_PAGE_SIZE + EXHIBIT_PAGE_SIZE)
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
                className={`an-scroll-arrow${exhibitPage >= Math.ceil(dynamicCategories.length / EXHIBIT_PAGE_SIZE) - 1 ? ' an-scroll-hidden' : ''}`}
                onClick={() => { setExhibitPage(p => p + 1); setAnimDir('right'); setAnimKey(k => k + 1); }}
                aria-label="Next exhibits"
              >
                <ChevronRight style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-8 lg:px-8">
        <p className="text-sm text-muted-foreground m-0">
          Showing <span className="font-medium text-foreground">{filteredAnimals.length}</span> animals
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAnimals.map((animal, idx) => {
              return (
                <article
                  key={`${animal.id}-${viewMode}`}
                  className="animal-card-enter group relative overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:shadow-xl hover:border-primary/20 flex flex-col"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={animal.imageUrl ? (animal.imageUrl?.startsWith('http') ? animal.imageUrl : `${API_BASE_URL}${animal.imageUrl}`) : placeholderImg}
                      alt={animal.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-[rgba(0,0,0,0.5)] to-[rgba(0,0,0,0.05)]" />

                    {(animal.isEndangered === true || animal.isEndangered === 1) && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide" style={{ background: 'rgba(234,88,12,0.18)', color: '#ea580c', border: '1.5px solid #ea580c', backdropFilter: 'blur(6px)' }}>
                          Endangered
                        </span>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10 w-full box-border">
                      <p className="text-xs text-white/70 italic m-0" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>{animal.species}</p>
                      <h2 className="text-xl font-bold text-white tracking-tight m-0" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{animal.name}</h2>
                      <div className="flex items-center gap-1 mt-2 text-xs text-white/80" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                        <MapPin className="h-3 w-3 shrink-0" />
                        {animal.exhibit || "Zoo-wide"}
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-[#1e140d]/90 p-4 flex flex-col justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100 z-20">
                      <div className="text-white">
                        <h3 className="font-semibold text-lg mb-3 mt-0 tracking-tight">Quick Facts</h3>
                        <div className="space-y-2 text-sm text-white/90">
                          <p className="m-0"><span className="text-white/70">Diet:</span> {animal.diet || 'Unknown'}</p>
                          <p className="m-0"><span className="text-white/70">Lifespan:</span> {animal.lifespan || 'Unknown'}</p>
                          <p className="m-0"><span className="text-white/70">Weight:</span> {animal.weight || 'Unknown'}</p>
                          <p className="m-0"><span className="text-white/70">Region:</span> {animal.region || 'Unknown'}</p>
                        </div>
                        {animal.funFact && (
                          <div className="mt-4 p-3 bg-white/10 rounded-xl border border-white/5">
                            <p className="text-xs text-white/90 flex items-start gap-2 m-0 leading-relaxed tracking-wide">
                              <Info className="h-4 w-4 shrink-0 mt-[2px]" />
                              {animal.funFact}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredAnimals.map((animal, idx) => {
              return (
                <article key={`${animal.id}-${viewMode}`} className="animal-card-enter group flex flex-col md:flex-row overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:shadow-xl hover:border-primary/20" style={{ animationDelay: `${idx * 40}ms` }}>
                  <div className="relative w-full md:w-64 shrink-0 aspect-video md:aspect-square overflow-hidden bg-muted">
                    <img
                      src={animal.imageUrl ? (animal.imageUrl?.startsWith('http') ? animal.imageUrl : `${API_BASE_URL}${animal.imageUrl}`) : placeholderImg}
                      alt={animal.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {animal.isEndangered && (
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide" style={{ background: 'rgba(234,88,12,0.18)', color: '#ea580c', border: '1.5px solid #ea580c', backdropFilter: 'blur(6px)' }}>
                          Endangered
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground italic m-0">{animal.species}</p>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground m-0">{animal.name}</h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            {animal.exhibit || "Zoo-wide"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-6 text-sm">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Diet</span>
                        <span className="font-medium">{animal.diet || 'Unknown'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Lifespan</span>
                        <span className="font-medium">{animal.lifespan || 'Unknown'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Weight</span>
                        <span className="font-medium">{animal.weight || 'Unknown'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Region</span>
                        <span className="font-medium">{animal.region || 'Unknown'}</span>
                      </div>
                    </div>

                    {animal.funFact && (
                      <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
                        <p className="text-sm text-muted-foreground flex items-start gap-2 m-0">
                          <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                          <span><strong>Fun Fact:</strong> {animal.funFact}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {filteredAnimals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold m-0">No animals found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </section>

    </div>
  );
};

export default AnimalPage;
