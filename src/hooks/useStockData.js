import { useState, useEffect } from 'react';
import { 
  doc, collection, onSnapshot, query, orderBy, 
  writeBatch, serverTimestamp, deleteDoc, setDoc, increment 
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
      // Limitamos a los últimos 50 para no cargar demasiada memoria innecesaria
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

  // Acciones (Lógica de escritura CORREGIDA)
  const updateStock = async (movesToExecute, values) => {
    if (!user) return;
    const movesArray = Array.isArray(movesToExecute) ? movesToExecute : [movesToExecute];
    
    try {
      const batch = writeBatch(db);
      const timestamp = serverTimestamp();
      
      // 1. Registrar Transacciones (Esto queda igual, es el historial)
      movesArray.forEach(move => {
        const transRef = doc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'transactions'));
        batch.set(transRef, {
          moveId: move.id, values, timestamp, userId: user.uid
        });
      });

      // 2. Calcular Actualización Atómica (SOLUCIÓN RACE CONDITION)
      // En lugar de leer el estado local, modificarlo y sobrescribir (set),
      // preparamos instrucciones de incremento para que el servidor haga la suma.
      const stockRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'core', 'stock_current');
      
      const updates = {};
      
      movesArray.forEach(move => {
        const moveId = move.id;
        
        Object.keys(values).forEach(prodId => {
          const addVal = parseInt(values[prodId]);
          
          if (addVal !== 0) {
            // Sintaxis de punto para actualizar campos anidados en Firestore
            // Ej: "move_1.balde" : increment(5)
            const fieldPath = `${moveId}.${prodId}`;
            updates[fieldPath] = increment(addVal);
          }
        });
      });

      // Si no hay nada que actualizar numéricamente, solo guardamos las transacciones
      if (Object.keys(updates).length > 0) {
        batch.update(stockRef, updates);
      }

      await batch.commit();
      return true;
    } catch (e) {
      console.error("Error updateStock:", e);
      alert("Error guardando movimiento. Verifique su conexión.");
      return false;
    }
  };

  const undoTransaction = async (transactionItem) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      
      // 1. Borrar del historial
      const transRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'transactions', transactionItem.id);
      batch.delete(transRef);
      
      // 2. Revertir cambios usando increment negativo (SOLUCIÓN RACE CONDITION EN UNDO)
      const stockRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'core', 'stock_current');
      const { moveId, values } = transactionItem;
      const updates = {};

      Object.keys(values).forEach(prodId => {
        const val = parseInt(values[prodId]);
        if (val !== 0) {
           // Restamos el valor original sumando su negativo
           updates[`${moveId}.${prodId}`] = increment(-val); 
        }
      });
      
      // IMPORTANTE: En undo también usamos update + increment negativo
      // para no sobrescribir cambios que hayan ocurrido después de esta transacción.
      if (Object.keys(updates).length > 0) {
        batch.update(stockRef, updates);
      }

      await batch.commit();
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