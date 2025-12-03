import React, { useState, useMemo } from 'react';
import { ArrowRight, History, Trash2, Save, ArrowLeft, Calendar } from 'lucide-react';
import { PRODUCTS, SECTOR_ORDER, SECTORS, MOVEMENTS_TYPES } from '../../config/constants';
import { getIntermediateMoves } from '../../utils/helpers';
import Button from '../ui/Button';
import PageLayout from '../ui/PageLayout';

// --- SUB-COMPONENTE: VISTA DE HISTORIAL COMPLETO ---
const HistoryFullView = ({ history, onUndo, onBack }) => {
  return (
    <PageLayout 
      title="Historial de Movimientos" 
      subtitle="Registro completo de operaciones recientes"
      actions={
        <Button variant="secondary" onClick={onBack} className="flex items-center gap-2">
           <ArrowLeft className="w-4 h-4" /> Volver a Carga
        </Button>
      }
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {history.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay movimientos registrados aún.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Hora</th>
                  <th className="px-6 py-3">Movimiento</th>
                  <th className="px-6 py-3">Detalle</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((item) => {
                  const moveLabel = MOVEMENTS_TYPES.find(m => m.id === item.moveId)?.label || 'Movimiento desconocido';
                  const dateObj = item.timestamp ? new Date(item.timestamp.seconds * 1000) : new Date();
                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = dateObj.toLocaleDateString();

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{timeStr}</div>
                        <div className="text-xs text-gray-400">{dateStr}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-800 font-medium">
                        {moveLabel}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(item.values).map(([prodId, val]) => {
                            const prod = PRODUCTS.find(p => p.id === prodId);
                            return (
                              <span key={prodId} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border ${prod?.color || 'bg-gray-100'} border-black/5`}>
                                <span className="font-bold">{val}</span> {prod?.name || prodId}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button 
                           onClick={() => {
                             if(window.confirm('¿Seguro que deseas deshacer este movimiento? Se restará del stock actual.')) {
                               onUndo(item);
                             }
                           }}
                           className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
                           title="Deshacer movimiento"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

// --- COMPONENTE PRINCIPAL ---
const QuickMovementsView = ({ stockState, history, onUpdateStock, onUndo }) => {
  const [viewMode, setViewMode] = useState('form'); // 'form' | 'history'
  const [fromSector, setFromSector] = useState(SECTOR_ORDER[1]); // Default: Deposito
  const [toSector, setToSector] = useState(SECTOR_ORDER[2]); // Default: Puerta
  
  const [tempValues, setTempValues] = useState({});
  const [loading, setLoading] = useState(false);

  // Calcular ruta y movimientos intermedios
  const calculatedPath = useMemo(() => {
    return getIntermediateMoves(fromSector, toSector);
  }, [fromSector, toSector]);

  const isValidPath = calculatedPath.length > 0;

  const handleInputChange = (productId, value) => {
    setTempValues(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  const handleSave = async () => {
    const valuesToSave = Object.entries(tempValues).reduce((acc, [key, val]) => {
      if (val && parseInt(val) !== 0) acc[key] = parseInt(val);
      return acc;
    }, {});

    if (Object.keys(valuesToSave).length === 0) {
      alert("Ingrese al menos una cantidad válida.");
      return;
    }

    if (!isValidPath) {
      alert("La ruta seleccionada no es válida.");
      return;
    }

    setLoading(true);
    await onUpdateStock(calculatedPath, valuesToSave);
    setLoading(false);
    setTempValues({});
    // Opcional: Mostrar feedback visual de éxito
  };

  // 1. SI ESTAMOS EN MODO HISTORIAL, RETORNAMOS EL SUB-COMPONENTE
  if (viewMode === 'history') {
    return <HistoryFullView history={history} onUndo={onUndo} onBack={() => setViewMode('form')} />;
  }

  // 2. SI NO, MOSTRAMOS EL FORMULARIO ORIGINAL
  return (
    <PageLayout 
      title="Movimientos Rápidos" 
      subtitle="Registre el flujo de mercadería entre sectores."
      actions={
        <Button variant="secondary" onClick={() => setViewMode('history')} className="flex items-center gap-2 text-xs sm:text-sm">
           <History className="w-4 h-4" /> Ver Historial
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          
          {/* SELECTOR DE RUTA */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4">Configurar Ruta</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Desde (Origen)</label>
                <select 
                  value={fromSector}
                  onChange={(e) => {
                    setFromSector(e.target.value);
                    if(SECTOR_ORDER.indexOf(e.target.value) >= SECTOR_ORDER.indexOf(toSector)) {
                       const nextIdx = SECTOR_ORDER.indexOf(e.target.value) + 1;
                       if (nextIdx < SECTOR_ORDER.length) setToSector(SECTOR_ORDER[nextIdx]);
                    }
                  }}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#ff7f00] outline-none"
                >
                  {SECTORS.filter(s => s.id !== 'desperdicio').map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-white p-1 rounded-full border border-gray-200 text-gray-400">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Hacia (Destino)</label>
                <select 
                  value={toSector}
                  onChange={(e) => setToSector(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#ff7f00] outline-none"
                >
                  {SECTORS.map(s => (
                    <option 
                      key={s.id} 
                      value={s.id} 
                      disabled={SECTOR_ORDER.indexOf(s.id) <= SECTOR_ORDER.indexOf(fromSector)}
                      className={SECTOR_ORDER.indexOf(s.id) <= SECTOR_ORDER.indexOf(fromSector) ? 'text-gray-300' : ''}
                    >
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* DETALLE DE PASOS */}
          <div className={`p-4 rounded-xl border ${isValidPath ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
            <h4 className={`font-semibold text-sm mb-2 ${isValidPath ? 'text-blue-800' : 'text-red-800'}`}>
              {isValidPath ? 'Resumen de la operación' : 'Ruta Inválida'}
            </h4>
            {isValidPath ? (
              <div className="space-y-2">
                <p className="text-xs text-blue-600">Se registrarán automáticamente {calculatedPath.length} movimientos:</p>
                <div className="space-y-1 pl-2 border-l-2 border-blue-200">
                  {calculatedPath.map((move, idx) => (
                    <div key={move.id} className="text-xs text-blue-700 flex items-center gap-2">
                      <span className="bg-blue-200 text-blue-800 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">{idx + 1}</span>
                      <span>{SECTORS.find(s=>s.id === move.source).name} ➔ {SECTORS.find(s=>s.id === move.target).name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-red-600">Seleccione un destino posterior al origen.</p>
            )}
          </div>

          {/* TARJETA DE ÚLTIMA ACTIVIDAD (RESUMEN) */}
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
             <div className="flex items-center gap-2 mb-2 text-orange-800">
                <Calendar className="w-4 h-4" />
                <h3 className="text-sm font-bold">Actividad Reciente</h3>
             </div>
             {history.length > 0 ? (
                <div className="text-xs text-orange-700">
                   <p>Último mov: <strong>{MOVEMENTS_TYPES.find(m => m.id === history[0].moveId)?.label}</strong></p>
                   <p className="mt-1 opacity-75">{new Date(history[0].timestamp?.seconds * 1000).toLocaleTimeString()}</p>
                   <button onClick={() => setViewMode('history')} className="mt-2 text-orange-900 underline font-medium">Ver todos</button>
                </div>
             ) : (
                <p className="text-xs text-orange-600">Sin movimientos hoy.</p>
             )}
          </div>

        </div>

        {/* INPUT DE PRODUCTOS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="font-semibold text-gray-700">
                Cargar: {SECTORS.find(s=>s.id === fromSector)?.name} ➔ {SECTORS.find(s=>s.id === toSector)?.name}
              </span>
              <Button onClick={handleSave} variant="success" className="py-1 px-3 text-xs sm:text-sm" disabled={loading || !isValidPath}>
                {loading ? 'Guardando...' : <><Save className="w-4 h-4" /> Guardar Todo</>}
              </Button>
            </div>
            
            <div className={`divide-y divide-gray-100 ${!isValidPath ? 'opacity-50 pointer-events-none' : ''}`}>
              {PRODUCTS.map((prod) => {
                const showStock = calculatedPath.length === 1;
                const singleMoveId = calculatedPath[0]?.id;
                const savedVal = showStock ? (stockState[singleMoveId]?.[prod.id] || 0) : 0;

                return (
                  <div key={prod.id} className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${prod.color} bg-opacity-30`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${prod.color} border border-black/10`}></div>
                      <span className={`font-medium ${prod.text === 'text-white' ? 'text-gray-800' : prod.text}`}>
                        {prod.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {showStock && savedVal > 0 && (
                        <div className="text-right hidden sm:block">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Hoy</span>
                          <span className="text-sm font-bold text-gray-700">{savedVal}</span>
                        </div>
                      )}
                      <input 
                        type="number"
                        placeholder="0"
                        min="0"
                        value={tempValues[prod.id] || ''}
                        onChange={(e) => handleInputChange(prod.id, e.target.value)}
                        className="w-24 text-right border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#ff7f00] focus:border-transparent outline-none bg-white font-mono text-lg"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
              <Button onClick={handleSave} className="w-full sm:w-auto" disabled={loading || !isValidPath}>
                {loading ? '...' : 'Confirmar y Guardar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default QuickMovementsView;