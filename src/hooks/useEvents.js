import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';

export const useEvents = (user) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si no hay usuario o db inicializada, no hacemos nada
    if (!user || !db) {
        setLoading(false);
        return;
    }

    const eventsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'events');
    // Ordenamos por fecha del evento para facilitar la visualización
    const q = query(eventsRef, orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(fetchedEvents);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addEvent = async (eventData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'events'), {
        ...eventData,
        createdBy: user.uid,
        createdAt: serverTimestamp() // Timestamp de creación, diferente a la fecha del evento
      });
      return true;
    } catch (e) {
      console.error("Error adding event:", e);
      alert("Error al guardar el evento.");
      return false;
    }
  };

  const deleteEvent = async (eventId) => {
    if (!user) return;
    if (!window.confirm("¿Estás seguro de eliminar este evento?")) return;
    
    try {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'events', eventId));
    } catch (e) {
      console.error("Error deleting event:", e);
      alert("Error al eliminar.");
    }
  };

  return { events, addEvent, deleteEvent, loading };
};