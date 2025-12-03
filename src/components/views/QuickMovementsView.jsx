import React, { useState, useMemo } from 'react';
import { ArrowRight, History, Trash2, Save } from 'lucide-react';
import { PRODUCTS, SECTOR_ORDER, SECTORS, MOVEMENTS_TYPES } from '../../config/constants';
import { getIntermediateMoves } from '../../utils/helpers';
import Button from '../ui/Button';
import PageLayout from '../ui/PageLayout';

const QuickMovementsView = ({ stockState, history, onUpdateStock, onUndo }) => {
  const [fromSector, setFromSector] = useState(SECTOR_ORDER[1]); // Default: Deposito
  const [toSector, setToSector] = useState(SECTOR_ORDER[2]); // Default: Puerta
  
  const [tempValues, setTempValues] = useState({});
  const [loading, setLoading] = useState(false);

  // Calcular ruta y movimientos intermedios
  const calculatedPath = useMemo(() => {
    return getIntermediateMoves(fromSector, toSector);
  }, [fromSector, toSector]);

  // Validar si la ruta es válida
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
      alert("La ruta seleccionada no es válida. Asegúrese de mover en la dirección correcta (ej: Deposito -> Candy).");
      return;
    }

    setLoading(true);
    // Enviamos TODOS los movimientos intermedios
    // El App.jsx ahora manejará un array de movimientos
    await onUpdateStock(calculatedPath, valuesToSave);
    
    setLoading(false);
    setTempValues({});
  };

  return (
    <PageLayout 
      title="Movimientos Rápidos" 
      subtitle="Registre el flujo de mercadería. Salte etapas y el sistema rellenará los intermedios."
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
                    // Resetear 'to' si es inválido o igual
                    if(SECTOR_ORDER.indexOf(e.target.value) >= SECTOR_ORDER.indexOf(toSector)) {
                       // Intentar poner el siguiente disponible
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
                    // Solo mostrar destinos que estén "después" del origen
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

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
               <History className="w-4 h-4 text-gray-500" />
               <h3 className="font-semibold text-gray-700 text-sm">Historial Reciente</h3>
            </div>
            
            {history.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No hay movimientos recientes.</p>
            ) : (
              <ul className="space-y-3">
                {history.slice(0, 5).map((item) => (
                  <li key={item.id} className="bg-gray-50 p-3 rounded-lg text-xs relative group border border-gray-100">
                    <div className="font-medium text-gray-800 mb-1">
                      {MOVEMENTS_TYPES.find(m => m.id === item.moveId)?.label}
                    </div>
                    <div className="text-gray-500 space-y-1">
                       {Object.entries(item.values).map(([prodId, val]) => (
                         <div key={prodId} className="flex justify-between">
                            <span>{PRODUCTS.find(p => p.id === prodId)?.name}:</span>
                            <span className="font-mono text-gray-700">+{val}</span>
                         </div>
                       ))}
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUndo(item);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 rounded-md transition-colors cursor-pointer z-10 shadow-sm"
                      title="Deshacer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
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
                // Mostrar stock actual solo si es una etapa simple (1 paso), si no, es confuso mostrar stock de multiples etapas
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