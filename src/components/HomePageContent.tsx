
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { ArrowRight, BrainCircuit, Edit, Grid3x3, Moon, Search, Sun, Gift, Star, Info, Package, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Autoplay from "embla-carousel-autoplay"
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useDailyReward } from "@/hooks/use-daily-reward";
import { DailyRewardDialog } from "@/components/DailyRewardDialog";
import { CountUp } from "@/components/CountUp";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AppDefinition } from "@/app/admin/apps/page";
import * as LucideIcons from 'lucide-react';
import Image from 'next/image';
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-is-mobile";

// Simulate fetching data
import appsData from '@/data/apps.json';

const getIcon = (iconName: string): React.ReactNode => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
        return <IconComponent className="text-primary" />;
    }
    return <Package className="text-primary" />; // Fallback icon
};

const CategoryCard = ({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) => (
  <Link href={href} className="flex flex-col items-center gap-2 flex-shrink-0 text-center">
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-md`}>
      {icon}
    </div>
    <span className="text-xs font-medium text-foreground leading-tight">{label}</span>
  </Link>
)

const DailyQuizCard = () => (
    <Card className="w-full h-full bg-primary text-primary-foreground shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-5 flex flex-col justify-between h-full relative">
            <div className="z-10">
                <h3 className="text-lg font-bold">Kuis Harian</h3>
                <p className="text-sm opacity-90 mt-1 max-w-[150px]">Asah kemampuanmu dengan kuis interaktif</p>
            </div>
            <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-white/20 flex items-center justify-center z-0">
                 <BrainCircuit className="text-primary-foreground w-8 h-8"/>
            </div>
        </CardContent>
    </Card>
);

const LatihanSoalCard = () => (
    <Card className="w-full h-full bg-primary text-primary-foreground shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-5 flex flex-col justify-between h-full relative">
             <div className="z-10">
                <h3 className="text-lg font-bold">Latihan Soal</h3>
                <p className="text-sm opacity-90 mt-1 max-w-[150px]">Perbanyak latihan untuk persiapan ujian.</p>
            </div>
             <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-white/20 flex items-center justify-center z-0">
                 <Edit className="text-primary-foreground w-8 h-8"/>
            </div>
        </CardContent>
    </Card>
)

const FlyingPoints = ({ isVisible, startRect }: { isVisible: boolean, startRect: DOMRect | null }) => {
  const pointsRef = React.useRef<HTMLDivElement>(null);

  const style: React.CSSProperties = startRect ? {
    position: 'fixed',
    left: `${startRect.left + startRect.width / 2 - 15}px`,
    top: `${startRect.top + startRect.height / 2 - 15}px`,
    transition: 'top 0.8s cubic-bezier(0.5, 1.5, 0.8, 1), left 0.8s ease-in-out, opacity 0.8s ease-out',
    opacity: 0,
    zIndex: 9999,
  } : { display: 'none' };
  
  React.useEffect(() => {
    if (isVisible && pointsRef.current) {
      setTimeout(() => {
        if(pointsRef.current) {
            pointsRef.current.style.opacity = '1';
            pointsRef.current.style.top = '65px'; // Target Y
            pointsRef.current.style.left = '100px'; // Target X
        }
      }, 50);
       setTimeout(() => {
        if(pointsRef.current) {
          pointsRef.current.style.opacity = '0';
        }
      }, 800);
    }
  }, [isVisible]);

  return (
    <div ref={pointsRef} style={style} className="flex items-center justify-center font-bold text-lg text-primary bg-yellow-300 rounded-full w-14 h-14 shadow-lg border-2 border-white">
      +50
    </div>
  );
};

export default function HomePageContent() {
   const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true, stopOnMouseEnter: true })
   )
   const router = useRouter();
   const { theme, setTheme } = useTheme();
   const isMobile = useIsMobile();
   const [isDialogOpen, setIsDialogOpen] = React.useState(false);
   const { user, isAuthenticated } = useAuth();
   const { points: rewardPoints, claimState, claimReward, refreshClaimState } = useDailyReward();
   
   const [flyingPointsVisible, setFlyingPointsVisible] = React.useState(false);
   const [startRect, setStartRect] = React.useState<DOMRect | null>(null);

   const [mainFeatures, setMainFeatures] = useState<AppDefinition[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   // Determine which points to display (user's or guest's)
   const displayPoints = isAuthenticated && user ? user.points : rewardPoints;

   useEffect(() => {
        const sortedApps = [...appsData].sort((a, b) => a.order - b.order);
        // Get the "All Apps" definition and remove it from the list for now
        const allAppsOption = sortedApps.find(app => app.id === 'app_all_apps');
        const otherApps = sortedApps.filter(app => app.id !== 'app_all_apps');
        
        // Take the first 5 other apps
        const featuresToShow = otherApps.slice(0, 5);
        if (allAppsOption) {
            // Add "All Apps" as the 6th item
            featuresToShow.push(allAppsOption);
        }

        setMainFeatures(featuresToShow);
        setIsLoading(false);
    }, []);

   const handleClaimWithPosition = async (dayIndex: number, element: HTMLElement) => {
     const rect = element.getBoundingClientRect();
     setStartRect(rect);
     onOpenChange(false);
     
     const success = await claimReward(dayIndex);
     if (success) {
        setFlyingPointsVisible(true);
        setTimeout(() => setFlyingPointsVisible(false), 1000);
     }
   }

   const onOpenChange = (isOpen: boolean) => {
       if (isOpen) {
           refreshClaimState();
       }
       setIsDialogOpen(isOpen);
   }

   const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get('search') as string;
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
   };
   
  return (
    <>
      <FlyingPoints isVisible={flyingPointsVisible} startRect={startRect} />
      <DailyRewardDialog 
        isOpen={isDialogOpen}
        onOpenChange={onOpenChange}
        claimState={claimState}
        onClaim={claimReward}
        onClaimWithPosition={handleClaimWithPosition}
      />
      <div className="flex flex-col h-full bg-background overflow-x-hidden">
        <header className="bg-primary text-primary-foreground p-6 pb-20 rounded-b-[40px] shadow-lg">
          <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                  <p className="opacity-80 text-sm">{isAuthenticated ? 'Selamat Datang!' : 'Selamat Datang, Tamu!'}</p>
                  <h1 className="text-2xl font-bold">{isAuthenticated && user ? user.name : 'Silakan Login'}</h1>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
          </div>
          <div className="bg-primary-foreground/20 backdrop-blur-sm p-3 rounded-2xl flex justify-between items-center">
              <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm opacity-80">Coin Anda</p>
                     <Popover>
                        <PopoverTrigger asChild>
                           <Info className="w-4 h-4 cursor-pointer opacity-80 hover:opacity-100"/>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Apa itu Coin?</h4>
                                <p className="text-sm text-muted-foreground">
                                Coin adalah mata uang virtual di aplikasi ini. Anda bisa mendapatkannya secara gratis dengan check-in harian.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Untuk apa Coin digunakan?</h4>
                                <p className="text-sm text-muted-foreground">
                                Beberapa fitur canggih atau premium di aplikasi ini mungkin memerlukan sejumlah Coin untuk sekali pakai. Namun, sebagian besar alat tetap gratis digunakan tanpa batas!
                                </p>
                            </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                  </div>
                  <div className="text-2xl font-bold">
                    <CountUp end={displayPoints ?? 0} />
                  </div>
              </div>
              <Button variant="secondary" className="bg-white/90 hover:bg-white text-primary rounded-full font-bold" onClick={() => onOpenChange(true) }>
                  <Gift className="mr-2 h-4 w-4"/>
                  Klaim Coin
              </Button>
          </div>
        </header>
        
        <main className="flex-1 flex flex-col -mt-10 z-10">
          <div className="w-full px-6">
              <form className="relative" onSubmit={handleSearch}>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    name="search"
                    type="search"
                    placeholder="Cari tool yg kamu butuhkan"
                    className="w-full rounded-full bg-card text-foreground placeholder:text-muted-foreground pl-11 pr-4 py-2 h-12 border-2 border-transparent focus-visible:border-primary focus-visible:ring-0"
                  />
              </form>
          </div>

          <section id="features" className="my-4 px-6">
            <div className="grid grid-cols-3 gap-y-4 gap-x-2">
              {isLoading ? (
                  <div className="col-span-3 flex justify-center items-center h-24 w-full">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
              ) : (
                <>
                  {mainFeatures.map(feature => (
                      <CategoryCard key={feature.id} href={feature.href} icon={getIcon(feature.icon)} label={feature.title} />
                  ))}
                </>
              )}
            </div>
          </section>

          <section id="interactive-cards" className="mb-4 w-full">
            <Carousel
              opts={{
                align: "center",
                loop: true,
              }}
              plugins={[plugin.current]}
              className="w-full"
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
            >
              <CarouselContent className="-ml-2">
                <CarouselItem className="basis-4/5 md:basis-1/2 pl-2">
                  <div className="p-1 h-36">
                    <DailyQuizCard />
                  </div>
                </CarouselItem>
                <CarouselItem className="basis-4/5 md:basis-1/2 pl-2">
                  <div className="p-1 h-36">
                  <LatihanSoalCard />
                  </div>
                </CarouselItem>
                <CarouselItem className="basis-4/5 md:basis-1/2 pl-2">
                  <div className="p-1 h-36">
                    <DailyQuizCard />
                  </div>
                </CarouselItem>
              </CarouselContent>
            </Carousel>
          </section>
          
          <div className="px-6">
            <section id="recommendations" className="pb-28">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">Rekomendasi untuk Anda</h2>
                    <Link href="#" className="text-sm text-primary font-semibold">Lihat Semua</Link>
                </div>
                <div className="space-y-4">
                    <Card className="shadow-sm border-0 bg-card">
                        <CardContent className="p-4 flex gap-4 items-center">
                            <Image data-ai-hint="education learning" src="https://placehold.co/100x100.png" alt="Edukasi" className="w-20 h-20 rounded-lg object-cover" width={100} height={100} />
                            <div className="flex-1">
                                <h3 className="font-bold leading-tight">Tips Belajar Efektif di Era Digital</h3>
                                <p className="text-sm text-muted-foreground mt-1">Maksimalkan waktumu dengan metode yang terbukti.</p>
                            </div>
                            {!isMobile && (
                              <Button variant="ghost" size="icon" className="rounded-full shrink-0">
                                  <ArrowRight className="w-4 h-4 text-muted-foreground"/>
                              </Button>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-0 bg-card">
                        <CardContent className="p-4 flex gap-4 items-center">
                            <Image data-ai-hint="technology education" src="https://placehold.co/100x100.png" alt="Teknologi" className="w-20 h-20 rounded-lg object-cover" width={100} height={100}/>
                            <div className="flex-1">
                                <h3 className="font-bold leading-tight">Teknologi dalam Pendidikan</h3>
                                <p className="text-sm text-muted-foreground mt-1">Peran AI dan teknologi dalam proses belajar.</p>
                            </div>
                            {!isMobile && (
                              <Button variant="ghost" size="icon" className="rounded-full shrink-0">
                                  <ArrowRight className="w-4 h-4 text-muted-foreground"/>
                              </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
