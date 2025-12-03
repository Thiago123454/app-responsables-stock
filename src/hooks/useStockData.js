import { useState, useEffect } from 'react';
import { 
  doc, collection, onSnapshot, query, orderBy, 
  writeBatch, serverTimestamp, deleteDoc, setDoc 
} from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';

export const useStockData = (user) => {
  const [stockState, setStockState] = useState({ move_1: {}, move_2: {}, move_3: {}, move_4: {} });
  const [previousDayStock, setPreviousDayStock] = useState({ move_1: {}, move_2: {}, move_3: {}, move_4: {} });
  const [history, setHistory] = useState([]);
  const [config, setConfig] = useState({ resetTime: "05:00", lastResetDate: new Date().toDateString() });
  const [error, setError] = useState(null);

  // Suscripciones
  useEffect(() => {
    if (!user || !db) return;

    try {
      const stockCurrentRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'core', 'stock_current');
      const stockPrevRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'core', 'stock_previous');
      const configRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'core', 'app_config');
      const historyRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'transactions');
      const historyQuery = query(historyRef, orderBy('timestamp', 'desc'));

      const unsubCurrent = onSnapshot(stockCurrentRef, (snap) => {
        if (snap.exists()) setStockState(snap.data());
      }, () => setError("Error leyendo Stock"));

      const unsubPrev = onSnapshot(stockPrevRef, (snap) => {
        if (snap.exists()) setPreviousDayStock(snap.data());
      });

      const unsubConfig = onSnapshot(configRef, (snap) => {
        if (snap.exists()) setConfig(snap.data());
      });

      const unsubHistory = onSnapshot(historyQuery, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setHistory(data);
      });

      return () => {
        unsubCurrent(); unsubPrev(); unsubConfig(); unsubHistory();
      };
    } catch (e) {
      console.error("Error listeners", e);
    }
  }, [user]);

  // Acciones (Lógica de escritura)
  const updateStock = async (movesToExecute, values) => {
    if (!user) return;
    const movesArray = Array.isArray(movesToExecute) ? movesToExecute : [movesToExecute];
    
    try {
      const batch = writeBatch(db);
      const timestamp = serverTimestamp();
      
      // 1. Registrar Transacciones
      movesArray.forEach(move => {
        const transRef = doc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'transactions'));
        batch.set(transRef, {
          moveId: move.id, values, timestamp, userId: user.uid
        });
      });

      // 2. Calcular Nuevo Estado Optimista
      const newStockState = JSON.parse(JSON.stringify(stockState));
      movesArray.forEach(move => {
        const moveId = move.id;
        if (!newStockState[moveId]) newStockState[moveId] = {};
        
        Object.keys(values).forEach(prodId => {
          const currentVal = parseInt(newStockState[moveId][prodId] || 0);
          const addVal = parseInt(values[prodId]);
          newStockState[moveId][prodId] = currentVal + addVal;
        });
      });

      // 3. Guardar Estado
      const stockRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'core', 'stock_current');
      batch.set(stockRef, newStockState);

      await batch.commit();
      return true;
    } catch (e) {
      console.error(e);
      alert("Error guardando movimiento.");
      return false;
    }
  };

  const undoTransaction = async (transactionItem) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'transactions', transactionItem.id));
      
      // Revertir estado (Simplificado)
      const newStockState = { ...stockState };
      const { moveId, values } = transactionItem;
      if (newStockState[moveId]) {
        Object.keys(values).forEach(prodId => {
          const currentVal = parseInt(newStockState[moveId][prodId] || 0);
          const subVal = parseInt(values[prodId]);
          newStockState[moveId][prodId] = Math.max(0, currentVal - subVal);
        });
        await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'core', 'stock_current'), newStockState);
      }
    } catch (e) {
      console.error(e);
      alert("Error al deshacer.");
    }
  };

  const updateConfig = async (newConfig) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'core', 'app_config'), newConfig);
    } catch (e) { console.error(e); }
  };

  return { 
    stockState, previousDayStock, history, config, error, 
    updateStock, undoTransaction, updateConfig 
  };
};