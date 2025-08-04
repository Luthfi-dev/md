
'use client';
import { useState, useCallback, useEffect } from 'react';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
import { encrypt, decrypt } from '@/lib/encryption';

const REWARD_AMOUNT = 50;
const TOTAL_DAYS = 7;
const GUEST_STORAGE_KEY = 'guestRewardState_v3'; // Encrypted
const USER_STORAGE_KEY_PREFIX = 'userRewardState_'; // Plaintext, user-specific

export interface ClaimState {
  isClaimed: boolean;
  isClaimable: boolean;
  isToday: boolean;
}

interface StoredRewardData {
  points: number;
  lastClaimTimestamps: { [dayIndex: number]: string }; // 'YYYY-MM-DD'
  guestId?: string; // For guests
}

const getDayIndex = (date: Date): number => {
    return (date.getDay() + 6) % 7; // Monday = 0, Sunday = 6
}

const getTodayDateString = (): string => {
    return new Date().toISOString().split('T')[0];
}

const generateGuestId = (): string => `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export function useDailyReward() {
  const { user, isAuthenticated, updateUser, fetchWithAuth } = useAuth();
  const [points, setPoints] = useState<number>(0);
  const [claimState, setClaimState] = useState<ClaimState[]>([]);
  const { toast } = useToast();

  const getStorageKey = useCallback(() => {
    if (isAuthenticated && user) {
        return `${USER_STORAGE_KEY_PREFIX}${user.id}`;
    }
    return GUEST_STORAGE_KEY;
  }, [isAuthenticated, user]);

  const loadData = useCallback((): StoredRewardData => {
    if (typeof window === 'undefined') return { points: 0, lastClaimTimestamps: {} };
    
    const key = getStorageKey();

    try {
      const storedDataRaw = window.localStorage.getItem(key);
      if (storedDataRaw) {
        let data: StoredRewardData;
        if (!isAuthenticated) {
            data = JSON.parse(decrypt(storedDataRaw));
        } else {
            data = JSON.parse(storedDataRaw);
        }

        if (data && typeof data.points === 'number' && typeof data.lastClaimTimestamps === 'object') {
           setPoints(data.points);
           return data;
        }
      }
    } catch (error) {
      console.error(`Failed to load or parse reward data from localStorage for key ${key}`, error);
    }

    const defaultData: StoredRewardData = isAuthenticated 
        ? { points: user?.points || 0, lastClaimTimestamps: {} }
        : { points: 100, lastClaimTimestamps: {}, guestId: generateGuestId() };
    
    setPoints(defaultData.points);
    return defaultData;
  }, [getStorageKey, isAuthenticated, user]);

  const saveData = useCallback((data: StoredRewardData) => {
    if (typeof window === 'undefined') return;
    const key = getStorageKey();
    try {
        if (!isAuthenticated) {
            const encryptedData = encrypt(JSON.stringify(data));
            window.localStorage.setItem(key, encryptedData);
        } else {
            window.localStorage.setItem(key, JSON.stringify(data));
        }
    } catch (e) {
        console.error("Failed to save reward data", e);
    }
  }, [getStorageKey, isAuthenticated]);


  const updateClaimState = useCallback(() => {
    const data = loadData();
    const todayStr = getTodayDateString();
    const todayIndex = getDayIndex(new Date());

    const newClaimState = Array.from({ length: TOTAL_DAYS }, (_, i) => {
      const isToday = i === todayIndex;
      const isClaimed = data.lastClaimTimestamps[i] === todayStr;
      const isClaimable = isToday && !isClaimed;

      return { isClaimed, isClaimable, isToday };
    });
    setClaimState(newClaimState);
  }, [loadData]);


  useEffect(() => {
    updateClaimState();
  }, [updateClaimState, isAuthenticated, user]);

  const claimReward = useCallback(async (dayIndex: number): Promise<boolean> => {
    const data = loadData();
    const todayIndex = getDayIndex(new Date());

    if (dayIndex !== todayIndex) {
        toast({ variant: "destructive", title: 'Klaim Gagal', description: 'Anda hanya dapat mengklaim hadiah untuk hari ini.' });
        return false;
    }

    const todayStr = getTodayDateString();
    if (data.lastClaimTimestamps[todayIndex] === todayStr) {
        toast({ variant: 'destructive', title: 'Sudah Diklaim', description: 'Anda sudah mengklaim hadiah untuk hari ini.' });
        return false;
    }

    const newPoints = (isAuthenticated ? (user?.points ?? 0) : data.points) + REWARD_AMOUNT;
    const newTimestamps = { ...data.lastClaimTimestamps, [todayIndex]: todayStr };
    
    const newData: StoredRewardData = { ...data, points: newPoints, lastClaimTimestamps: newTimestamps };
    
    saveData(newData);
    setPoints(newPoints);
    
    if(isAuthenticated) {
        updateUser({ points: newPoints });

        try {
            await fetchWithAuth('/api/user/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ points: newPoints })
            });
        } catch (error) {
            console.error("Failed to update points on server:", error);
            toast({ variant: "destructive", title: 'Gagal Sinkronisasi', description: 'Gagal menyimpan poin ke server. Mohon periksa koneksi Anda.' });
            // Optionally revert points update
            const revertedPoints = user?.points ?? 0;
            const revertedData = { ...newData, points: revertedPoints };
            saveData(revertedData);
            setPoints(revertedPoints);
            updateUser({ points: revertedPoints });
            return false;
        }
    }

    updateClaimState();
    
    toast({ title: 'Klaim Berhasil!', description: `Selamat! Anda mendapatkan ${REWARD_AMOUNT} Coin. Sampai jumpa besok!` });
    return true;

  }, [loadData, saveData, toast, updateClaimState, isAuthenticated, user, updateUser, fetchWithAuth]);
  
  const refreshClaimState = () => {
    updateClaimState();
  }

  return { points, claimState, claimReward, refreshClaimState };
}
