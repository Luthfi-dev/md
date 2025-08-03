
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


// Conversion factors relative to a base unit
const lengthUnits = {
  meter: 1,
  kilometer: 1000,
  mil: 1609.34,
  kaki: 0.3048,
  inci: 0.0254,
};

const weightUnits = {
  gram: 1,
  kilogram: 1000,
  pon: 453.592,
  ons: 28.3495,
};

type UnitData = {
  [key: string]: number;
};

const UnitConverterTab = ({
  units,
  defaultFrom,
  defaultTo,
  isTemperature = false
}: {
  units: UnitData;
  defaultFrom: string;
  defaultTo: string;
  isTemperature?: boolean;
}) => {
  const [fromUnit, setFromUnit] = useState(defaultFrom);
  const [toUnit, setToUnit] = useState(defaultTo);
  const [fromValue, setFromValue] = useState('1');
  const [toValue, setToValue] = useState('');

  const convert = (value: number, from: string, to: string) => {
    if(from === to) return value;
    
    if (isTemperature) {
        if(from === 'celsius' && to === 'fahrenheit') return (value * 9/5) + 32;
        if(from === 'celsius' && to === 'kelvin') return value + 273.15;
        if(from === 'fahrenheit' && to === 'celsius') return (value - 32) * 5/9;
        if(from === 'fahrenheit' && to === 'kelvin') return (value - 32) * 5/9 + 273.15;
        if(from === 'kelvin' && to === 'celsius') return value - 273.15;
        if(from === 'kelvin' && to === 'fahrenheit') return (value - 273.15) * 9/5 + 32;
        return value;
    }
    
    const valueInBase = value * units[from];
    const valueInTarget = valueInBase / units[to];
    return valueInTarget;
  };

  useMemo(() => {
    const val = parseFloat(fromValue);
    if (!isNaN(val)) {
      const result = convert(val, fromUnit, toUnit);
      setToValue(result.toLocaleString('en-US', { maximumFractionDigits: 4 }));
    } else {
      setToValue('');
    }
  }, [fromValue, fromUnit, toUnit]);

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromValue(e.target.value.replace(/,/g, ''));
  };
  
  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const val = parseFloat(e.target.value.replace(/,/g, ''));
     if (!isNaN(val)) {
        setToValue(e.target.value);
        const result = convert(val, toUnit, fromUnit);
        setFromValue(result.toLocaleString('en-US', { maximumFractionDigits: 4 }));
     } else {
        setFromValue('');
        setToValue('');
     }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="from-value">Dari</Label>
          <Input id="from-value" type="text" value={fromValue} onChange={handleFromChange} />
          <Select value={fromUnit} onValueChange={setFromUnit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.keys(units).map(unit => <SelectItem key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="to-value">Ke</Label>
          <Input id="to-value" type="text" value={toValue} onChange={handleToChange} />
          <Select value={toUnit} onValueChange={setToUnit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.keys(units).map(unit => <SelectItem key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default function UnitConverterPage() {
  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Konversi Unit</CardTitle>
          <CardDescription>Pilih kategori dan konversi unit secara instan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="length" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="length">Panjang</TabsTrigger>
              <TabsTrigger value="weight">Berat</TabsTrigger>
              <TabsTrigger value="temperature">Suhu</TabsTrigger>
            </TabsList>
            <TabsContent value="length" className="mt-6">
              <UnitConverterTab units={lengthUnits} defaultFrom="meter" defaultTo="kaki" />
            </TabsContent>
            <TabsContent value="weight" className="mt-6">
              <UnitConverterTab units={weightUnits} defaultFrom="kilogram" defaultTo="pon" />
            </TabsContent>
            <TabsContent value="temperature" className="mt-6">
              <UnitConverterTab units={{celsius: 0, fahrenheit: 0, kelvin: 0}} defaultFrom="celsius" defaultTo="fahrenheit" isTemperature={true} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
