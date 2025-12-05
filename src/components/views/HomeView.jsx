import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Plus, MapPin, Clock, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';
import Button from '../ui/Button';
import PageLayout from '../ui/PageLayout';

// Utilidad para formatear fechas (YYYY-MM-DD) preservando la zona horaria local
// Evita problemas donde new Date().toISOString() devuelve el día anterior por ser UTC
const formatDateId = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDaysArray = (centerDate, daysBack, daysForward) => {
  const days = [];
  for (let i = -daysBack; i <= daysForward; i++) {
    const d = new Date(centerDate);
    d.setDate(centerDate.getDate() + i);
    days.push(d);
  }
  return days;
};

// --- COMPONENTE DE MODAL PARA AGREGAR EVENTO ---
const AddEventModal = ({ isOpen, onClose, onSave, selectedDate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('09:00');
  const [type, setType] = useState('info'); // info, warning, success
  const [date, setDate] = useState(selectedDate); // Estado local para la fecha editable

  // Actualizar la fecha interna cuando se abre el modal o cambia la selección externa
  useEffect(() => {
    if (isOpen) {
        setDate(selectedDate);
    }
  }, [isOpen, selectedDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      title,
      description,
      time,
      type,
      date // Usamos la fecha del input, permitiendo agendar a futuro
    });
    // Reset form
    setTitle('');
    setDescription('');
    setTime('09:00');
    setType('info');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Nuevo Evento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* NUEVO CAMPO DE FECHA EDITABLE */}
          <div>
             <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Fecha del Evento</label>
             <input 
               type="date"
               required
               className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff7f00] outline-none"
               value={date}
               onChange={e => setDate(e.target.value)}
             />
          </div>

          <div>
             <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título</label>
             <input 
               autoFocus
               type="text" 
               required
               className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff7f00] outline-none"
               placeholder="Ej: Entrega de Mercadería"
               value={title}
               onChange={e => setTitle(e.target.value)}
             />
          </div>
          
          <div className="flex gap-4">
             <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Hora</label>
                <input 
                  type="time" 
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff7f00] outline-none"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
             </div>
             <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tipo</label>
                <select 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff7f00] outline-none bg-white"
                  value={type}
                  onChange={e => setType(e.target.value)}
                >
                  <option value="info">Info General</option>
                  <option value="warning">Importante</option>
                  <option value="success">Inventario/Stock</option>
                </select>
             </div>
          </div>

          <div>
             <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Descripción (Opcional)</label>
             <textarea 
               className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff7f00] outline-none resize-none h-24"
               placeholder="Detalles adicionales..."
               value={description}
               onChange={e => setDescription(e.target.value)}
             />
          </div>

          <div className="pt-2 flex gap-3">
             <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
             <Button type="submit" className="flex-1">Guardar Evento</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- VISTA PRINCIPAL ---
const HomeView = ({ user }) => {
  const { events, addEvent, deleteEvent, loading } = useEvents(user);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scrollRef = useRef(null);

  // Generamos un rango de fechas: 15 días atrás y 30 días adelante para el selector rápido
  const daysList = getDaysArray(new Date(), 15, 30);
  const todayStr = formatDateId(new Date());
  const selectedDateStr = formatDateId(selectedDate);

  // Filtrar eventos para el día seleccionado en la vista principal
  const dayEvents = events.filter(e => e.date === selectedDateStr).sort((a,b) => a.time.localeCompare(b.time));

  // Próximos eventos (globales, futuros, excluyendo el día seleccionado actualmente)
  const upcomingEvents = events
    .filter(e => e.date >= todayStr && e.date !== selectedDateStr)
    .sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5); // Mostrar los 5 más próximos

  // Efecto para hacer scroll al día actual al cargar
  useEffect(() => {
    if (scrollRef.current) {
        const todayEl = scrollRef.current.querySelector(`[data-date="${todayStr}"]`);
        if (todayEl) {
            todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }
  }, []); 

  const handleDayClick = (date) => {
      setSelectedDate(date);
  };

  return (
    <PageLayout 
      title="Calendario" 
      subtitle={`Eventos del ${selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}`}
      actions={
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 text-sm">
           <Plus size={16} /> <span className="hidden sm:inline">Nuevo Evento</span>
        </Button>
      }
    >
      <div className="space-y-6">
        
        {/* --- CALENDARIO HORIZONTAL (TIMELINE) --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <div 
                ref={scrollRef}
                className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide snap-x"
                style={{ scrollBehavior: 'smooth' }}
            >
                {daysList.map((day) => {
                    const dStr = formatDateId(day);
                    const isSelected = dStr === selectedDateStr;
                    const isToday = dStr === todayStr;
                    const hasEvents = events.some(e => e.date === dStr);
                    
                    return (
                        <button
                            key={dStr}
                            data-date={dStr}
                            onClick={() => handleDayClick(day)}
                            className={`
                                flex-shrink-0 w-14 h-20 rounded-lg flex flex-col items-center justify-center gap-1 transition-all snap-center
                                ${isSelected ? 'bg-[#ff7f00] text-white shadow-md scale-105' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}
                                ${isToday && !isSelected ? 'border-2 border-[#ff7f00] text-[#ff7f00]' : 'border border-transparent'}
                            `}
                        >
                            <span className="text-[10px] uppercase font-bold tracking-wider">
                                {day.toLocaleDateString('es-AR', { weekday: 'short' }).slice(0,3)}
                            </span>
                            <span className="text-xl font-bold">
                                {day.getDate()}
                            </span>
                            {hasEvents && (
                                <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#ff7f00]'}`}></div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>

        {/* --- LISTA DE EVENTOS DEL DÍA --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-[#ff7f00]" />
                    Agenda del Día
                </h3>
                
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Cargando eventos...</div>
                ) : dayEvents.length > 0 ? (
                    dayEvents.map(event => (
                        <div key={event.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow group relative overflow-hidden">
                            {/* Borde de color según tipo */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                event.type === 'warning' ? 'bg-red-500' : 
                                event.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                            }`}></div>

                            <div className="flex flex-col items-center min-w-[3rem] pt-1">
                                <span className="font-bold text-gray-800 text-lg">{event.time}</span>
                                {event.type === 'warning' && <AlertCircle className="w-4 h-4 text-red-500 mt-1" />}
                                {event.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />}
                            </div>
                            
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 text-lg">{event.title}</h4>
                                {event.description && <p className="text-gray-500 text-sm mt-1">{event.description}</p>}
                            </div>

                            <button 
                                onClick={() => deleteEvent(event.id)}
                                className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Eliminar evento"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center flex flex-col items-center text-gray-400">
                        <CalendarIcon className="w-10 h-10 mb-2 opacity-20" />
                        <p>No hay eventos programados para este día.</p>
                        <button onClick={() => setIsModalOpen(true)} className="text-[#ff7f00] font-medium text-sm mt-2 hover:underline">
                            + Agregar uno ahora
                        </button>
                    </div>
                )}
            </div>

            {/* --- PRÓXIMOS EVENTOS --- */}
            <div className="space-y-3">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider text-opacity-80">Próximamente</h3>
                {upcomingEvents.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
                        {upcomingEvents.map(event => (
                            <div key={event.id} className="p-3 flex gap-3 items-center hover:bg-gray-50">
                                <div className="bg-gray-100 rounded-lg p-2 text-center min-w-[3.5rem]">
                                    {/* Forzamos interpretación local agregando la hora para evitar desfase de UTC */}
                                    <div className="text-[10px] text-gray-500 uppercase">{new Date(event.date + 'T00:00:00').toLocaleDateString('es-AR', {month:'short'})}</div>
                                    <div className="font-bold text-gray-800">{new Date(event.date + 'T00:00:00').getDate()}</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-800 truncate text-sm">{event.title}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock size={10} /> {event.time}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 italic">No hay más eventos próximos.</p>
                )}
                
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 mt-4">
                    <div className="flex gap-2 text-blue-800 font-bold text-sm mb-1">
                        <MapPin size={16} /> <span>Recordatorio</span>
                    </div>
                    <p className="text-xs text-blue-600 leading-relaxed">
                        Recuerda hacer los movimientos de stock antes de finalizar el turno.
                    </p>
                </div>
            </div>
        </div>

      </div>

      <AddEventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={addEvent}
        selectedDate={selectedDateStr}
      />
    </PageLayout>
  );
};

export default HomeView;