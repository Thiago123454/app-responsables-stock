import { useState, useEffect } from 'react';
import { doc, runTransaction, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';

export const useDailyReset = (user, config) => {
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!user || !db || !config) return;

    const checkAndRun = async () => {
      try {
        const now = new Date();
        const currentDateString = now.toDateString(); 
        const [resetHour, resetMinute] = config.resetTime.split(':').map(Number);
        
        const todayResetThreshold = new Date(now);
        todayResetThreshold.setHours(resetHour, resetMinute, 0, 0);

        // Si aún no es hora, no hacemos nada
        if (now < todayResetThreshold) return;

        // Referencias
        const configRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'core', 'app_config');
        const stockPrevRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'core', 'stock_previous');
        const stockCurrentRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'core', 'stock_current');

        let resetPerformed = false;

        await runTransaction(db, async (transaction) => {
            const configDoc = await transaction.get(configRef);
            const serverConfig = configDoc.exists() ? configDoc.data() : config;
            
            // Si ya se hizo el reset hoy (según el servidor), abortamos
            if (serverConfig.lastResetDate === currentDateString) return; 
            
            const currentStockDoc = await transaction.get(stockCurrentRef);
            const currentStockData = currentStockDoc.exists() ? currentStockDoc.data() : {};

            // Mover actual a previo y limpiar actual
            transaction.set(stockPrevRef, currentStockData);
            transaction.set(stockCurrentRef, { move_1: {}, move_2: {}, move_3: {}, move_4: {} });
            transaction.set(configRef, { ...serverConfig, lastResetDate: currentDateString });
            
            resetPerformed = true;
        });
        
        if (resetPerformed) {
          setIsResetting(true);
          // Limpieza de historial
          const transactionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'transactions');
          const batch = writeBatch(db);
          const snap = await getDocs(transactionsRef);
          snap.forEach(d => batch.delete(d.ref));
          await batch.commit();
          
          setTimeout(() => setIsResetting(false), 3000); 
        }

      } catch (e) {
        console.error("Error en reset:", e);
        setIsResetting(false);
      }
    };

    checkAndRun();
    const interval = setInterval(checkAndRun, 60000); // Chequear cada minuto
    return () => clearInterval(interval);

  }, [user, config.resetTime, config.lastResetDate]);

  return { isResetting };
};