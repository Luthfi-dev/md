
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Sigma, CornerDownLeft, Divide, X, Minus, Plus, Percent, Expand, Minimize } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';


export default function CalculatorPage() {
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState<string[]>([]);
  const [isScientific, setIsScientific] = useState(false);
  const [currentExpression, setCurrentExpression] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const calculatorRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();


  const handleFullScreenChange = useCallback(() => {
    setIsFullScreen(!!document.fullscreenElement);
  }, []);


  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, [handleFullScreenChange]);

  const handleFullScreenToggle = () => {
    if (!calculatorRef.current) return;

    if (!document.fullscreenElement) {
      calculatorRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleInput = (value: string) => {
    if (display === 'Error') {
      setDisplay(value);
      setCurrentExpression(value);
      return;
    }
    if (value === '.' && display.includes('.')) return;

    const newDisplay = display === '0' && value !== '.' ? value : display + value;
    setDisplay(newDisplay);
    setCurrentExpression(currentExpression + value);
  };

  const handleOperator = (operator: string) => {
    if (display === 'Error') return;
    const lastChar = currentExpression.trim().slice(-1);
    if (!currentExpression && operator === '-') {
        setCurrentExpression('-');
        setDisplay('-');
        return;
    }
    if (['+', '-', '*', '/'].includes(lastChar)) {
      setCurrentExpression(currentExpression.trim().slice(0, -1) + operator);
    } else if (currentExpression) {
      setCurrentExpression(currentExpression + operator);
    }
    setDisplay('0');
  };
  
  const calculateResult = () => {
    if (display === 'Error' || !currentExpression) return;
    try {
        let expressionToEvaluate = currentExpression
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/−/g, '-')
          .replace(/%/g, '/100');

        // eslint-disable-next-line no-eval
        const result = eval(expressionToEvaluate);
        const resultString = String(result);
        const fullCalculation = `${currentExpression} = ${resultString}`;
        
        setDisplay(resultString);
        setHistory(prev => [fullCalculation, ...prev]);
        setCurrentExpression(resultString);
    } catch (error) {
        setDisplay('Error');
        setCurrentExpression('');
    }
  };

  const clearDisplay = () => {
    setDisplay('0');
    setCurrentExpression('');
  };
  
  const backspace = () => {
      if (display === 'Error') {
          clearDisplay();
          return;
      }
      setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
      setCurrentExpression(prev => prev.length > 1 ? prev.slice(0, -1) : '');
  }

  const handleScientific = (func: string) => {
    if (display === 'Error') return;
    try {
      const value = parseFloat(display);
      let result;
      switch (func) {
        case 'sin': result = Math.sin(value * Math.PI / 180); break;
        case 'cos': result = Math.cos(value * Math.PI / 180); break;
        case 'tan': result = Math.tan(value * Math.PI / 180); break;
        case 'log': result = Math.log10(value); break;
        case 'ln': result = Math.log(value); break;
        case 'sqrt': result = Math.sqrt(value); break;
        case '^2': result = Math.pow(value, 2); break;
        case 'pi': result = Math.PI; break;
        default: result = value;
      }
       const newExpression = String(result);
       setDisplay(newExpression);
       setCurrentExpression(newExpression);
    } catch (e) {
      setDisplay('Error');
      setCurrentExpression('');
    }
  }

  const buttonClass = "h-16 text-2xl font-bold rounded-2xl";
  const fsButtonClass = "h-full text-xl xl:text-2xl font-bold rounded-lg flex-1";
  const sciButtonClass = "h-12 text-xl font-bold rounded-2xl";
  const fsSciButtonClass = "h-full text-lg font-bold rounded-lg flex-1";

  const renderButtons = () => {
    const buttons = [
      { label: 'C', action: clearDisplay, className: 'bg-destructive/80 hover:bg-destructive text-white' },
      { label: '⌫', action: backspace },
      { label: '%', action: () => handleOperator('%') },
      { label: '÷', action: () => handleOperator('/'), icon: <Divide/>, key: '/'},
      { label: '7', action: () => handleInput('7') },
      { label: '8', action: () => handleInput('8') },
      { label: '9', action: () => handleInput('9') },
      { label: '×', action: () => handleOperator('*'), icon: <X/>, key: '*' },
      { label: '4', action: () => handleInput('4') },
      { label: '5', action: () => handleInput('5') },
      { label: '6', action: () => handleInput('6') },
      { label: '−', action: () => handleOperator('-'), icon: <Minus/>, key: '-' },
      { label: '1', action: () => handleInput('1') },
      { label: '2', action: () => handleInput('2') },
      { label: '3', action: () => handleInput('3') },
      { label: '+', action: () => handleOperator('+'), icon: <Plus/>, key: '+' },
      { label: '0', action: () => handleInput('0'), className: 'col-span-2' },
      { label: '.', action: () => handleInput('.') },
      { label: '=', action: calculateResult, className: 'bg-primary hover:bg-primary/90 text-white', key: 'Enter' },
    ];

    const scientificButtons = [
        { label: 'sin', action: () => handleScientific('sin') },
        { label: 'cos', action: () => handleScientific('cos') },
        { label: 'tan', action: () => handleScientific('tan') },
        { label: 'log', action: () => handleScientific('log') },
        { label: 'ln', action: () => handleScientific('ln') },
        { label: '√', action: () => handleScientific('sqrt') },
        { label: 'x²', action: () => handleScientific('^2') },
        { label: 'π', action: () => handleScientific('pi') },
    ];

    if(isFullScreen){
        return (
             <div className="flex flex-col gap-1 p-2 flex-1">
                {isScientific && (
                    <div className="grid grid-cols-4 gap-1 flex-shrink-0 h-12">
                        {scientificButtons.map(b => (
                            <Button key={b.label} onClick={b.action} variant="outline" className={fsSciButtonClass}>{b.label}</Button>
                        ))}
                    </div>
                )}
                <div className="grid grid-cols-4 grid-rows-5 gap-1 flex-grow">
                    {buttons.map(btn => (
                        <Button key={btn.label} onClick={btn.action} variant="outline" className={cn(fsButtonClass, btn.className || '')}>
                        {btn.icon || btn.label}
                        </Button>
                    ))}
                </div>
            </div>
        )
    }
    
    return (
      <div className="pt-4">
        {isScientific && (
            <div className="grid grid-cols-4 gap-2 mb-2 px-4">
                {scientificButtons.map(b => (
                    <Button key={b.label} onClick={b.action} variant="outline" className={sciButtonClass}>{b.label}</Button>
                ))}
            </div>
        )}
        <div className="grid grid-cols-4 grid-rows-5 gap-2 px-4 pb-4">
            {buttons.map(btn => (
                <Button key={btn.label} onClick={btn.action} variant="outline" className={`${buttonClass} ${btn.className || ''}`}>
                  {btn.icon || btn.label}
                </Button>
            ))}
        </div>
      </div>
    );
  }
  
  const renderHistory = () => (
     <div className={cn('flex flex-col px-4 pt-4', isFullScreen ? "px-2 pt-2 flex-1 min-h-0" : "flex-grow min-h-0")}>
        <div className='flex items-center justify-between mb-2 shrink-0'>
            <div className='flex items-center gap-2 text-muted-foreground font-semibold'>
                <History className='w-5 h-5'/>
                <span>Riwayat</span>
            </div>
            {history.length > 0 && 
                <Button variant="ghost" size="sm" onClick={() => setHistory([])}>Bersihkan</Button>
            }
        </div>
        <ScrollArea className="flex-1 rounded-lg bg-secondary/50">
            <div className="p-2">
                {history.length > 0 ? (
                    history.map((item, index) => (
                        <div key={index} className="text-sm p-1 hover:bg-primary/10 rounded-md cursor-pointer" onClick={() => {
                            const [expr, res] = item.split(' = ');
                            if(expr && res) {
                                setCurrentExpression(expr);
                                setDisplay(res);
                            }
                        }}>
                            {item}
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground py-8">
                        Tidak ada riwayat.
                    </div>
                )}
            </div>
        </ScrollArea>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <Card ref={calculatorRef} className={cn("max-w-md mx-auto shadow-2xl rounded-3xl overflow-hidden transition-all duration-300 bg-background flex flex-col", isFullScreen && "fixed inset-0 z-50 w-full h-full max-w-none rounded-none")}>
        <CardHeader className="shrink-0">
          <CardTitle className="text-2xl font-headline flex items-center justify-between">
            Kalkulator
             <div className="flex items-center space-x-2">
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
                <Sigma className='w-4 h-4' />
                <Switch id="scientific-mode" checked={isScientific} onCheckedChange={setIsScientific} />
                <Label htmlFor="scientific-mode" className="text-sm">Ilmiah</Label>
                 {isFullScreen && (
                  <Button variant="ghost" size="icon" onClick={handleFullScreenToggle}>
                      <X className="w-5 h-5"/>
                  </Button>
                )}
            </div>
          </CardTitle>
          <CardDescription>Kalkulator standar dan ilmiah dalam genggaman.</CardDescription>
        </CardHeader>
        <CardContent className={cn("flex flex-col p-0", isFullScreen && "flex-grow min-h-0")}>
            {isFullScreen ? (
                <div className="flex flex-col h-full">
                    <div className='bg-secondary rounded-2xl p-4 m-2 mb-0 text-right shrink-0'>
                        <div className='text-muted-foreground text-sm h-6 truncate'>{currentExpression || '...'}</div>
                        <div className="text-5xl font-bold break-all h-14 flex items-center justify-end">{display}</div>
                    </div>
                    {renderHistory()}
                    {renderButtons()}
                </div>
            ) : (
                <>
                    <div className='bg-secondary rounded-2xl p-4 m-4 mb-0 text-right shrink-0'>
                        <div className='text-muted-foreground text-sm h-6 truncate'>{currentExpression || '...'}</div>
                        <div className="text-5xl font-bold break-all h-14 flex items-center justify-end">{display}</div>
                    </div>
                    {renderButtons()}
                </>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
