import { useState, useEffect } from 'react';
import { doc, runTransaction, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import { MOVEMENTS_TYPES } from '../config/constants'; // Importamos las constantes para hacerlo dinámico

export const useDailyReset = (user, config) => {
  // 'isResetting': indica que se está ejecutando el proceso de cierre (esto SI bloquea).
  const [isResetting, setIsResetting] = useState(false);
  
  // 'checkingDate': indica validación inicial. Iniciamos en true para bloquear al montar.
  const [checkingDate, setCheckingDate] = useState(true);

  useEffect(() => {
    if (!user || !db || !config) {
        if(user === null) setCheckingDate(false); 
        return;
    }

    // Bloqueamos la UI explícitamente solo al montar el componente o cambiar la config
    setCheckingDate(true);

    const runDailyCheck = async () => {
      try {
        const now = new Date();
        const currentDateString = now.toDateString(); 
        const [resetHour, resetMinute] = config.resetTime.split(':').map(Number);
        
        const todayResetThreshold = new Date(now);
        todayResetThreshold.setHours(resetHour, resetMinute, 0, 0);

        // Si es temprano (antes de la hora de cierre), liberamos y salimos.
        if (now < todayResetThreshold) {
            setCheckingDate(false);
            return;
        }

        // Referencias
        const configRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'core', 'app_config');
        const stockPrevRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'core', 'stock_previous');
        const stockCurrentRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'core', 'stock_current');

        let resetWasNeeded = false;

        await runTransaction(db, async (transaction) => {
            const configDoc = await transaction.get(configRef);
            const serverConfig = configDoc.exists() ? configDoc.data() : config;
            
            // Si ya se hizo el cierre hoy, liberamos y salimos.
            if (serverConfig.lastResetDate === currentDateString) {
                return; 
            }

            // --- DETECTAMOS NUEVO DÍA ---
            resetWasNeeded = true;
            
            // Lógica de movimiento de stock
            const currentStockDoc = await transaction.get(stockCurrentRef);
            const currentStockData = currentStockDoc.exists() ? currentStockDoc.data() : {};

            // CORRECCIÓN #1: Generación dinámica del objeto vacío
            // En lugar de hardcodear { move_1: {}, ... }, lo creamos basado en la config actual.
            const emptyStock = MOVEMENTS_TYPES.reduce((acc, move) => {
                acc[move.id] = {};
                return acc;
            }, {});

            transaction.set(stockPrevRef, currentStockData);
            transaction.set(stockCurrentRef, emptyStock); // Usamos el objeto dinámico
            transaction.set(configRef, { ...serverConfig, lastResetDate: currentDateString });
        });
        
        if (resetWasNeeded) {
          setIsResetting(true); // Esto activará el bloqueo visual "Realizando Cierre..."
          
          // Limpieza de historial
          const transactionsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'transactions');
          const batch = writeBatch(db);
          const snap = await getDocs(transactionsRef);
          snap.forEach(d => batch.delete(d.ref));
          await batch.commit();
          
          setTimeout(() => {
              setIsResetting(false);
              setCheckingDate(false);
          }, 2000); 
        } else {
            // Si no hubo que hacer nada, nos aseguramos de liberar el bloqueo inicial
            setCheckingDate(false);
        }

      } catch (e) {
        console.error("Error en daily check:", e);
        setCheckingDate(false);
        setIsResetting(false);
      }
    };

    // 1. Ejecución Inmediata
    runDailyCheck();

    // 2. Ejecución Periódica
    const interval = setInterval(runDailyCheck, 60000); 
    return () => clearInterval(interval);

  }, [user, config?.resetTime]);

  return { 
      isResetting, 
      shouldBlockApp: isResetting || checkingDate 
  };
};