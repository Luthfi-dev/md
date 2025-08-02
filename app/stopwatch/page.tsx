
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, RotateCcw, Flag, ArrowUp, ArrowDown, Expand, Minimize, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-is-mobile';


export default function StopwatchPage() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isFullScreen, setIsFullScreen] = useState(false);
  const stopwatchRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();


  const handleFullScreenChange = useCallback(() => {
    setIsFullScreen(!!document.fullscreenElement);
  }, []);

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, [handleFullScreenChange]);

  const handleFullScreenToggle = () => {
    if (!stopwatchRef.current) return;
    if (!document.fullscreenElement) {
      stopwatchRef.current.requestFullscreen().catch(err => {
        alert(`Gagal mengaktifkan mode layar penuh: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  const startTimer = useCallback(() => {
      if (isRunning) return;
      setIsRunning(true);
      const startTime = Date.now() - time;
      timerRef.current = setInterval(() => {
        setTime(Date.now() - startTime);
      }, 10);
  }, [time, isRunning]);

  const stopTimer = useCallback(() => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const handleToggle = () => {
    if (isRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  };

  const handleLap = () => {
    if (isRunning) {
      setLaps(prevLaps => [time, ...prevLaps]);
    }
  };

  const handleReset = () => {
    stopTimer();
    setTime(0);
    setLaps([]);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    const milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
    return `${minutes}:${seconds}.${milliseconds}`;
  };

  const getLapStats = (currentLaps: number[]) => {
    if (currentLaps.length < 2) return { fastest: null, slowest: null };
    const lapTimes = currentLaps.map((lap, i) => {
        const prevLap = currentLaps[i + 1] || 0;
        return lap - prevLap;
    });
    const fastest = Math.min(...lapTimes);
    const slowest = Math.max(...lapTimes);
    return { fastest, slowest };
  };

  const { fastest, slowest } = getLapStats(laps);
  
  const renderButtons = () => {
    const buttonClass = "h-20 w-20 text-lg flex-shrink-0 rounded-full text-white";
    
    return (
      <div className="flex justify-around items-center h-20 my-4 w-full">
        <Button 
          onClick={isRunning ? handleLap : handleReset} 
          variant="secondary" 
          className={cn(buttonClass, "bg-gray-500 hover:bg-gray-600")}
          disabled={!isRunning && time === 0}
        >
          {isRunning ? <Flag /> : <RotateCcw />}
        </Button>
        <Button 
          onClick={handleToggle} 
          className={cn(
            buttonClass, 
            isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
          )}
        >
          {isRunning ? <Pause /> : <Play />}
        </Button>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <Card ref={stopwatchRef} className={cn(
        "max-w-md mx-auto shadow-2xl rounded-3xl overflow-hidden transition-all duration-300 bg-card flex flex-col",
         isFullScreen && "fixed inset-0 z-50 w-full h-full max-w-none rounded-none bg-background"
      )}>
        <CardHeader className="text-center shrink-0">
          <CardTitle className="text-3xl font-headline flex items-center justify-center gap-4">
             Stopwatch
              <div className="flex items-center gap-2">
                {isMobile && (
                    <div className="relative">
                        <div className="custom-tooltip">Mode Layar Penuh</div>
                    </div>
                )}
                <Button variant="ghost" size="icon" className="animate-shake" onClick={handleFullScreenToggle}>
                    {isFullScreen ? <Minimize className="w-5 h-5"/> : <Expand className="w-5 h-5"/>}
                </Button>
              </div>
              {isFullScreen && (
                  <Button variant="ghost" size="icon" onClick={handleFullScreenToggle} className="absolute top-4 right-4">
                      <X className="w-5 h-5"/>
                  </Button>
              )}
          </CardTitle>
          <CardDescription>Ukur waktu dengan presisi dan catat putaran.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow p-4 min-h-0">
          <div className="relative flex-shrink-0 flex flex-col items-center justify-center">
            <div className={cn(
              "font-mono my-4 tracking-tight w-full text-center break-all p-2",
              isFullScreen ? "text-8xl" : "text-6xl"
            )}>
              {formatTime(time)}
            </div>
          </div>
          
          <div className="w-full max-w-xs mx-auto mb-4 shrink-0">
            {renderButtons()}
          </div>

          <div className='w-full flex-grow min-h-0 flex flex-col'>
             <ScrollArea className="flex-grow rounded-lg bg-secondary/30">
                {laps.length > 0 ? (
                <ul className='divide-y divide-border p-2'>
                   <li className="flex justify-between items-center p-3 font-mono text-lg font-bold">
                        <span>Putaran {laps.length}</span>
                        <span>{formatTime(time - (laps[0] || 0))}</span>
                    </li>
                    {laps.map((lapTime, index) => {
                        const previousLapTime = laps[index+1] || 0;
                        const currentLapDuration = lapTime - previousLapTime;
                        const isFastest = currentLapDuration === fastest;
                        const isSlowest = currentLapDuration === slowest;

                        return (
                            <li key={index} className={cn("flex justify-between items-center p-3 font-mono text-lg",
                                isFastest && laps.length > 1 && 'text-green-500 font-bold',
                                isSlowest && laps.length > 1 && 'text-red-500 font-bold'
                            )}>
                                <span className="flex items-center gap-2">
                                     {isFastest && laps.length > 1 && <ArrowDown className='w-5 h-5' />}
                                     {isSlowest && laps.length > 1 && <ArrowUp className='w-5 h-5' />}
                                    Putaran {laps.length - index}
                                </span>
                                <span>
                                    {formatTime(currentLapDuration)}
                                </span>
                            </li>
                        )
                    })}
                </ul>
                ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-8">
                    Tekan "Putaran" untuk mencatat waktu.
                </div>
                )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
