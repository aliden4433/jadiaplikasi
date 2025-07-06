
'use client';

import { createContext, useState, ReactNode, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';

interface DangerZoneContextType {
  isDangerZoneActive: boolean;
  activateDangerZone: (password: string) => boolean;
  deactivateDangerZone: () => void;
}

const DangerZoneContext = createContext<DangerZoneContextType | undefined>(undefined);

const DANGER_ZONE_PASSWORD = "123qwe";

export function DangerZoneProvider({ children }: { children: ReactNode }) {
  const [isDangerZoneActive, setIsDangerZoneActive] = useState(false);
  const { toast } = useToast();

  const activateDangerZone = (password: string) => {
    if (password === DANGER_ZONE_PASSWORD) {
      setIsDangerZoneActive(true);
      toast({
        title: "Zona Bahaya Diaktifkan",
        description: "Fitur penghapusan data kini tersedia.",
      });
      return true;
    } else {
      toast({
        variant: "destructive",
        title: "Kata Sandi Salah",
        description: "Anda tidak memiliki izin untuk mengaktifkan mode ini.",
      });
      return false;
    }
  };

  const deactivateDangerZone = () => {
    setIsDangerZoneActive(false);
    toast({
        title: "Zona Bahaya Dinonaktifkan",
        description: "Fitur penghapusan data telah dimatikan.",
    });
  };

  return (
    <DangerZoneContext.Provider value={{ isDangerZoneActive, activateDangerZone, deactivateDangerZone }}>
      {children}
    </DangerZoneContext.Provider>
  );
}

export const useDangerZone = () => {
  const context = useContext(DangerZoneContext);
  if (context === undefined) {
    throw new Error('useDangerZone must be used within a DangerZoneProvider');
  }
  return context;
};
