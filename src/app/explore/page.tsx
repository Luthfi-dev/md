
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Star, Flame } from 'lucide-react';
import { ToolCard } from '@/components/ToolCard';
import type { AppDefinition } from '@/types/app';
import * as LucideIcons from 'lucide-react';

const BROWSER_STORAGE_KEY_FAVORITES = 'favorite_apps';

const getIcon = (iconName: string): ReactNode => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
        return <IconComponent className="w-8 h-8 text-primary" />;
    }
    return <LucideIcons.Package className="w-8 h-8 text-primary" />; // Fallback icon
};

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [allApps, setAllApps] = useState<AppDefinition[]>([]);
  const [favoriteApps, setFavoriteApps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/apps');
        const data = await res.json();
        if (data.success) {
          const sortedApps = data.items
            .filter((app: AppDefinition) => app.id !== 'app_all_apps')
            .sort((a: AppDefinition, b: AppDefinition) => a.order - b.order);
          setAllApps(sortedApps);
        } else {
          console.error("Failed to fetch apps from API");
        }
        
        const storedFavorites = window.localStorage.getItem(BROWSER_STORAGE_KEY_FAVORITES);
        if (storedFavorites) {
            setFavoriteApps(JSON.parse(storedFavorites));
        }
      } catch (error) {
        console.error("Failed to fetch or load data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleFavorite = (appId: string) => {
    const newFavorites = favoriteApps.includes(appId)
      ? favoriteApps.filter(id => id !== appId)
      : [...favoriteApps, appId];
    
    setFavoriteApps(newFavorites);
    try {
        window.localStorage.setItem(BROWSER_STORAGE_KEY_FAVORITES, JSON.stringify(newFavorites));
    } catch (error) {
        console.error("Failed to save favorite apps to localStorage", error);
    }
  };

  const filteredApps = allApps.filter(app =>
    app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const favorited = filteredApps.filter(app => favoriteApps.includes(app.id));
  const popular = filteredApps.filter(app => app.isPopular && !favoriteApps.includes(app.id));
  const others = filteredApps.filter(app => !favoriteApps.includes(app.id) && !app.isPopular);

  const renderAppGrid = (apps: AppDefinition[], title: string, icon?: ReactNode) => {
    if (apps.length === 0) return null;
    return (
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">{icon}{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {apps.map((app) => (
            <ToolCard
              key={app.id}
              href={app.href}
              icon={getIcon(app.icon)}
              title={app.title}
              description={app.description}
              isFavorited={favoriteApps.includes(app.id)}
              onFavoriteToggle={() => toggleFavorite(app.id)}
            />
          ))}
        </div>
      </section>
    );
  };

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
       <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-headline tracking-tight">Semua Aplikasi</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Temukan semua alat yang Anda butuhkan di satu tempat.
          </p>
        </div>

        <div className="relative mb-12">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari aplikasi..."
              className="w-full rounded-full bg-card text-foreground shadow-sm pl-12 pr-4 py-3 h-14"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {filteredApps.length > 0 ? (
            <div>
              {renderAppGrid(favorited, "Aplikasi Favorit", <Star className="text-yellow-400" />)}
              {renderAppGrid(popular, "Populer", <Flame className="text-orange-500" />)}
              {renderAppGrid(others, "Alat Lainnya")}
            </div>
        ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Aplikasi tidak ditemukan untuk "{searchTerm}".</p>
            </div>
        )}
       </div>
    </div>
  );
}
