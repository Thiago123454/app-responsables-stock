import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  ArrowRightLeft, 
  Mail, 
  Send, 
  History,
  Trash2,
  Settings,
  Clock,
  Zap,
  Save,
  RotateCcw,
  Wifi,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  Bug,
  ArrowRight
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  getDoc,
  writeBatch,
  runTransaction,
  getDocs 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyB9g809B-1ahP4ZYz3Mck0-vjBLT6N9srg",
  authDomain: "movimientos-88740.firebaseapp.com",
  projectId: "movimientos-88740",
  storageBucket: "movimientos-88740.firebasestorage.app",
  messagingSenderId: "300496648792",
  appId: "1:300496648792:web:f02f1832a2c1230df7282d"
};

// Inicialización segura
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Error inicializando Firebase:", e);
}

const appId = 'stock-cine-multiplex-v1'; 

// --- Definición de Productos y Colores ---
const PRODUCTS = [
  { id: 'balde', name: 'Balde', color: 'bg-[#d9ead3]', text: 'text-gray-800' },
  { id: 'botellas', name: 'Botellas', color: 'bg-[#fff2cc]', text: 'text-gray-800' },
  { id: 'latas', name: 'Latas', color: 'bg-[#c9daf8]', text: 'text-gray-800' },
  { id: 'confites', name: 'Confites', color: 'bg-[#d0e0e3]', text: 'text-gray-800' },
  { id: 'nachos', name: 'Nachos', color: 'bg-[#ead1dc]', text: 'text-gray-800' },
  { id: 'bolsas_pop', name: 'Bolsas Pop', color: 'bg-[#b4a7d6]', text: 'text-white' },
  { id: 'pringles', name: 'Pringles', color: 'bg-[#fce5cd]', text: 'text-gray-800' },
  { id: 'vasos_720', name: 'Vasos 720', color: 'bg-[#76a5af]', text: 'text-white' },
  { id: 'vasos_pl', name: 'Vasos PL', color: 'bg-[#e06666]', text: 'text-white' },
];

// Definimos el orden lógico del flujo para calcular pasos intermedios
const SECTOR_ORDER = ['depoSala1', 'deposito', 'puerta', 'candy', 'desperdicio'];

const SECTORS = [
  { id: 'depoSala1', name: 'Depo Sala 1', type: 'cajas' },
  { id: 'deposito', name: 'Deposito', type: 'unidades' },
  { id: 'puerta', name: 'Puerta', type: 'unidades' },
  { id: 'candy', name: 'Candy', type: 'unidades' },
  { id: 'desperdicio', name: 'Desperdicio', type: 'unidades' },
];

const MOVEMENTS_TYPES = [
  { id: 'move_1', label: 'Depo sala1 a Deposito', subLabel: '(En cajas)', source: 'depoSala1', target: 'deposito', unit: 'Cajas' },
  { id: 'move_2', label: 'Deposito a Puerta', subLabel: '(Unidades)', source: 'deposito', target: 'puerta', unit: 'Unidades' },
  { id: 'move_3', label: 'Puerta a Candy', subLabel: '(Unidades)', source: 'puerta', target: 'candy', unit: 'Unidades' },
  { id: 'move_4', label: 'Candy a Desperdicio', subLabel: '(Unidades)', source: 'candy', target: 'desperdicio', unit: 'Unidades' },
];

// Helper para encontrar los movimientos intermedios
const getIntermediateMoves = (fromId, toId) => {
  const fromIndex = SECTOR_ORDER.indexOf(fromId);
  const toIndex = SECTOR_ORDER.indexOf(toId);
  
  if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) return [];

  const moves = [];
  // Recorremos desde el origen hasta el destino paso a paso
  for (let i = fromIndex; i < toIndex; i++) {
    const currentSource = SECTOR_ORDER[i];
    const currentTarget = SECTOR_ORDER[i+1];
    // Buscamos el movimiento definido que conecta estos dos sectores
    const move = MOVEMENTS_TYPES.find(m => m.source === currentSource && m.target === currentTarget);
    if (move) moves.push(move);
  }
  return moves;
};

// --- Componentes de UI ---

const Button = ({ children, variant = "primary", className = "", ...props }) => {
  const baseStyle = "w-full sm:w-auto px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm flex items-center justify-center gap-2 text-sm";
  const variants = {
    primary: "bg-gradient-to-r from-[#ff7f00] to-[#ff9933] hover:from-[#e67300] hover:to-[#e68a00] text-white focus:ring-orange-500",
    secondary: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:ring-gray-200",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 focus:ring-red-500",
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const PageLayout = ({ title, subtitle, children, actions }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 sm:pb-0">
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{title}</h2>
        {subtitle && <p className="text-sm sm:text-base text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
    <div className="w-full">{children}</div>
  </div>
);

// --- Componente: Pestaña Configuración ---

const SettingsView = ({ config, onSaveConfig }) => {
  const [resetTime, setResetTime] = useState(config?.resetTime || "05:00");

  const handleSave = () => {
    onSaveConfig({ ...config, resetTime });
    alert("Configuración guardada en la nube.");
  };

  const handleForceResetDebug = () => {
    onSaveConfig({ ...config, lastResetDate: "PENDIENTE_PRUEBA" });
    alert("Indicador de cierre borrado. El sistema intentará ejecutar el cierre de nuevo si la hora actual > hora programada.");
  };

  return (
    <PageLayout title="Configuración" subtitle="Ajustes generales del sistema">
      <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
        
        {/* Sección de Hora */}
        <div>
            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100">
            <div className="bg-orange-100 p-2 rounded-lg text-[#ff7f00]">
                <Clock className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-800">Cierre Diario Automático</h3>
                <p className="text-sm text-gray-500">Defina cuándo se reinician los movimientos.</p>
            </div>
            </div>

            <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hora de reinicio (Madrugada)</label>
                <input 
                type="time" 
                value={resetTime}
                onChange={(e) => setResetTime(e.target.value)}
                className="block w-full sm:w-48 border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-[#ff7f00] outline-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                A esta hora, los "Movimientos de Hoy" pasarán a ser "Movimientos del Día Anterior" y el contador volverá a cero.
                </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600">
                <strong>Último cierre realizado:</strong> {config?.lastResetDate || "Nunca"}
                </p>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave}>Guardar Cambios</Button>
            </div>
            </div>
        </div>

        {/* Sección de Debug / Pruebas */}
        <div className="border-t border-gray-100 pt-6">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 text-red-800 font-bold text-sm">
                    <Bug className="w-4 h-4" />
                    <span>Zona de Pruebas (Debug)</span>
                </div>
                <p className="text-xs text-red-600 mb-4 leading-relaxed">
                    Utiliza este botón si necesitas probar la funcionalidad de cierre automático HOY mismo. 
                    Esto borrará la "marca" de que el cierre ya se hizo, forzando al sistema a intentarlo de nuevo si la hora ya pasó.
                </p>
                <Button variant="danger" onClick={handleForceResetDebug} className="w-full sm:w-auto text-xs py-2">
                    Resetear Bandera de Cierre
                </Button>
            </div>
        </div>

      </div>
    </PageLayout>
  );
};

// --- Componente: Pestaña Movimientos Rápidos ---

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

// --- Componente: Pestaña Movimiento Stock (Planilla Completa) ---

const StockSheetView = ({ stockState, previousDayStock }) => {
  return (
    <PageLayout 
      title="Planilla de Movimientos" 
      subtitle="Control de entradas y salidas por sector"
      actions={
        <Button variant="secondary" className="text-xs">
           <RotateCcw className="w-4 h-4" /> En vivo
        </Button>
      }
    >
      <div className="space-y-8">
        {SECTORS.map((sector) => {
          const inputMove = MOVEMENTS_TYPES.find(m => m.target === sector.id);
          const outputMove = MOVEMENTS_TYPES.find(m => m.source === sector.id);

          return (
            <div key={sector.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              {/* Header del Sector */}
              <div className="bg-gray-800 text-white px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <h3 className="font-bold text-lg">{sector.name}</h3>
                <span className="text-xs text-gray-300 uppercase tracking-wider bg-gray-700 px-2 py-1 rounded">
                  {sector.type}
                </span>
              </div>

              {/* Tabla del Sector */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs">
                      <th className="py-2 px-4 text-left font-semibold w-1/4">Producto</th>
                      
                      {/* Entradas Hoy */}
                      <th className="py-2 px-2 text-center w-1/5">
                        <div className="font-bold text-gray-700">Entrada</div>
                        <div className="text-[10px] font-normal normal-case text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap max-w-[80px] mx-auto">
                          {inputMove ? 'viene de ' + SECTORS.find(s=>s.id === inputMove.source)?.name : '-'}
                        </div>
                      </th>
                      
                      {/* Salida Total Hoy */}
                      <th className="py-2 px-4 text-center font-bold text-gray-900 w-1/4 bg-[#ff7f00]/10 border-x border-orange-100">
                        <div className="text-[#bf0000]">Salida (Total)</div>
                        <div className="text-[10px] font-normal normal-case text-gray-500">
                          {outputMove ? 'va hacia ' + SECTORS.find(s=>s.id === outputMove.target)?.name : '-'}
                        </div>
                      </th>

                      {/* Salida Ayer */}
                      <th className="py-2 px-4 text-center font-semibold text-gray-500 w-1/5">
                        Salida Ayer
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {PRODUCTS.map((prod) => {
                      // Valores HOY
                      const inVal = inputMove ? (stockState[inputMove.id]?.[prod.id] || 0) : 0;
                      const outVal = outputMove ? (stockState[outputMove.id]?.[prod.id] || 0) : 0;

                      // Valores AYER
                      const prevOut = outputMove ? (previousDayStock[outputMove.id]?.[prod.id] || 0) : 0;

                      return (
                        <tr key={prod.id} className={`${prod.color} bg-opacity-40 hover:brightness-95 transition-colors`}>
                          <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${prod.color} border border-black/20`}></div>
                             {prod.name}
                          </td>
                          
                          {/* Entrada Hoy */}
                          <td className="py-3 px-2 text-center font-mono text-gray-600">
                            {inVal !== 0 ? <span className="text-green-700 font-medium">{inVal}</span> : '-'}
                          </td>

                          {/* Salida Total Hoy */}
                          <td className="py-3 px-4 text-center font-bold font-mono text-base bg-white/60 border-x border-white/50 text-gray-900 shadow-sm">
                            {outVal !== 0 ? outVal : <span className="text-gray-300">-</span>}
                          </td>

                          {/* Salida Ayer */}
                          <td className="py-3 px-4 text-center font-mono text-gray-500">
                            {prevOut !== 0 ? prevOut : <span className="text-gray-300">-</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
};

// --- Datos Simulados (Menú) ---

const menuItems = [
  { id: 'rapidos', label: 'Mov. Rápidos', icon: Zap }, 
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'movimiento', label: 'Mov. Stock', icon: ArrowRightLeft },
  { id: 'pedidos', label: 'Pedidos', icon: Mail },
  { id: 'envio-stock', label: 'Envío', icon: Send },
];

const PlaceholderView = ({ title }) => (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <h3 className="text-lg font-medium">Módulo: {title}</h3>
      <p className="text-sm">En desarrollo...</p>
    </div>
);

// --- APP PRINCIPAL ---

export default function StockApp() {
  const [activeTab, setActiveTab] = useState('rapidos'); 
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  
  // Estados Iniciales
  const [stockState, setStockState] = useState({
    move_1: {}, move_2: {}, move_3: {}, move_4: {},
  });
  const [previousDayStock, setPreviousDayStock] = useState({
    move_1: {}, move_2: {}, move_3: {}, move_4: {},
  });
  const [history, setHistory] = useState([]);
  const [config, setConfig] = useState({
    resetTime: "05:00", 
    lastResetDate: new Date().toDateString() 
  });

  // 1. Autenticación
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Fallo Autenticación", e);
        setAuthError("No se pudo conectar a Firebase.");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if(u) setAuthError(null);
    });
    return () => unsubscribe();
  }, []);

  // 2. Suscripción a Firestore
  useEffect(() => {
    if (!user || !db) return;

    try {
      const stockCurrentRef = doc(db, 'artifacts', appId, 'public', 'data', 'core', 'stock_current');
      const stockPrevRef = doc(db, 'artifacts', appId, 'public', 'data', 'core', 'stock_previous');
      const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'core', 'app_config');
      
      const historyRef = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
      const historyQuery = query(historyRef, orderBy('timestamp', 'desc'));

      const unsubCurrent = onSnapshot(stockCurrentRef, (snap) => {
        if (snap.exists()) setStockState(snap.data());
      }, (e) => setAuthError("Error leyendo DB: Revisa las Reglas"));
      
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

  // 3. Lógica de Cierre Diario ROBUSTA (Transaction-based)
  const checkAndRunDailyReset = async () => {
    if (!user || !db) return;

    try {
      const now = new Date();
      const currentDateString = now.toDateString(); 
      const [resetHour, resetMinute] = config.resetTime.split(':').map(Number);
      
      const todayResetThreshold = new Date(now);
      todayResetThreshold.setHours(resetHour, resetMinute, 0, 0);

      if (now < todayResetThreshold) return;

      const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'core', 'app_config');
      const stockPrevRef = doc(db, 'artifacts', appId, 'public', 'data', 'core', 'stock_previous');
      const stockCurrentRef = doc(db, 'artifacts', appId, 'public', 'data', 'core', 'stock_current');

      let resetPerformed = false;

      await runTransaction(db, async (transaction) => {
          const configDoc = await transaction.get(configRef);
          const serverConfig = configDoc.exists() ? configDoc.data() : config;
          
          if (serverConfig.lastResetDate === currentDateString) {
             return; 
          }
          
          const currentStockDoc = await transaction.get(stockCurrentRef);
          const currentStockData = currentStockDoc.exists() ? currentStockDoc.data() : { move_1: {}, move_2: {}, move_3: {}, move_4: {} };

          transaction.set(stockPrevRef, currentStockData);
          transaction.set(stockCurrentRef, { move_1: {}, move_2: {}, move_3: {}, move_4: {} });
          transaction.set(configRef, { ...serverConfig, lastResetDate: currentDateString });
          
          resetPerformed = true;
      });
      
      if (config.lastResetDate !== currentDateString) {
          setIsResetting(true);
          setTimeout(() => setIsResetting(false), 3000); 
      }

      if (resetPerformed) {
        console.log("Reset diario confirmado. Limpiando historial de transacciones...");
        const transactionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
        const transactionsSnapshot = await getDocs(transactionsRef);
        
        const deleteBatch = writeBatch(db);
        transactionsSnapshot.forEach((doc) => {
          deleteBatch.delete(doc.ref);
        });
        
        await deleteBatch.commit();
        console.log("Historial limpiado exitosamente.");
      }

    } catch (e) {
      console.error("Error en reset:", e);
      setIsResetting(false);
    }
  };

  useEffect(() => {
    checkAndRunDailyReset();
    const interval = setInterval(checkAndRunDailyReset, 60000); 
    return () => clearInterval(interval);
  }, [user, config.resetTime, config.lastResetDate]); 

  // --- NUEVO MANEJADOR DE ACTUALIZACIÓN (Soporta múltiples pasos) ---
  const handleUpdateStock = async (movesToExecute, values) => {
    if (!user) return;
    
    // Normalizar entrada: si viene un solo objeto, lo hacemos array
    const movesArray = Array.isArray(movesToExecute) ? movesToExecute : [movesToExecute];

    try {
      const batch = writeBatch(db);
      const timestamp = serverTimestamp();
      
      // 1. Crear transacciones en historial para CADA movimiento
      movesArray.forEach(move => {
        const transRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'));
        batch.set(transRef, {
          moveId: move.id,
          values,
          timestamp,
          userId: user.uid
        });
      });

      // 2. Calcular nuevo estado del stock acumulado
      // Hacemos una copia profunda del estado actual para modificarlo
      const newStockState = JSON.parse(JSON.stringify(stockState));

      // Iteramos sobre cada movimiento y aplicamos los valores
      movesArray.forEach(move => {
        const moveId = move.id;
        if (!newStockState[moveId]) newStockState[moveId] = {};
        
        Object.keys(values).forEach(prodId => {
          const currentVal = parseInt(newStockState[moveId][prodId] || 0);
          const addVal = parseInt(values[prodId]);
          newStockState[moveId][prodId] = currentVal + addVal;
        });
      });

      // 3. Guardar el estado FINAL del stock
      const stockRef = doc(db, 'artifacts', appId, 'public', 'data', 'core', 'stock_current');
      batch.set(stockRef, newStockState);

      await batch.commit();

    } catch (e) {
      console.error(e);
      alert("Error guardando los movimientos.");
    }
  };

  const handleUndo = async (transactionItem) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', transactionItem.id));
      const newStockState = { ...stockState };
      const { moveId, values } = transactionItem;
      if (newStockState[moveId]) {
        Object.keys(values).forEach(prodId => {
          const currentVal = parseInt(newStockState[moveId][prodId] || 0);
          const subVal = parseInt(values[prodId]);
          newStockState[moveId][prodId] = Math.max(0, currentVal - subVal);
        });
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'core', 'stock_current'), newStockState);
      }
    } catch (e) {
      console.error(e);
      alert("No se pudo deshacer.");
    }
  };

  const handleSaveConfig = async (newConfig) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'core', 'app_config'), newConfig);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col relative">
      
      {/* --- BANNER DE RESETEO AUTOMÁTICO --- */}
      {isResetting && (
        <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm font-bold animate-in slide-in-from-top fixed top-16 left-0 w-full z-40 flex items-center justify-center gap-2 shadow-md">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Realizando cierre diario y archivando movimientos...</span>
        </div>
      )}

      {/* Header Optimizado Móvil */}
      <header className="bg-[#bf0000] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-white/10 p-1.5 rounded text-white font-black tracking-tighter">MX</div>
             <span className="font-bold text-lg hidden sm:block">MULTIPLEX</span>
          </div>
          
          <nav className="hidden md:flex space-x-1 overflow-x-auto scrollbar-hide flex-1 justify-center mx-4">
             {menuItems.map(item => (
               <button 
                 key={item.id}
                 onClick={() => setActiveTab(item.id)}
                 className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap
                   ${activeTab === item.id ? 'bg-white text-[#bf0000] font-medium shadow' : 'text-white/80 hover:bg-white/10'}
                 `}
               >
                 <item.icon className="w-4 h-4" />
                 <span className="hidden sm:inline">{item.label}</span>
               </button>
             ))}
             <button 
               onClick={() => setActiveTab('config')}
               className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap
                 ${activeTab === 'config' ? 'bg-white text-[#bf0000] font-medium shadow' : 'text-white/80 hover:bg-white/10'}
               `}
               title="Configuración"
             >
               <Settings className="w-4 h-4" />
             </button>
          </nav>

          <div className="flex items-center gap-3">
             {authError ? (
               <div className="bg-red-600 px-2 py-1 rounded flex items-center gap-1 text-xs font-bold animate-pulse" title={authError}>
                 <WifiOff className="w-3 h-3" /> <span className="hidden sm:inline">Error</span>
               </div>
             ) : user ? (
               <div className="bg-green-600/50 px-2 py-1 rounded flex items-center gap-1 text-xs font-bold text-green-100">
                 <Wifi className="w-3 h-3" /> <span className="hidden sm:inline">Online</span>
               </div>
             ) : (
               <div className="bg-yellow-600/50 px-2 py-1 rounded flex items-center gap-1 text-xs font-bold text-yellow-100">
                 <AlertTriangle className="w-3 h-3" /> <span className="hidden sm:inline">Conectando</span>
               </div>
             )}

             <div className="hidden sm:block text-right text-xs">
               <p className="font-bold">Administrador</p>
               <p className="text-red-200">Canning</p>
             </div>
             <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold border-2 border-white">AD</div>
          </div>
        </div>
        
        {authError && (
          <div className="bg-red-100 text-red-800 text-xs text-center py-1 font-semibold">
            {authError}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'rapidos' && (
          <QuickMovementsView 
            stockState={stockState} 
            history={history}
            onUpdateStock={handleUpdateStock} 
            onUndo={handleUndo}
          />
        )}
        {activeTab === 'movimiento' && (
          <StockSheetView stockState={stockState} previousDayStock={previousDayStock} />
        )}
        {activeTab === 'config' && (
          <SettingsView config={config} onSaveConfig={handleSaveConfig} />
        )}
        {!['rapidos', 'movimiento', 'config'].includes(activeTab) && (
          <PageLayout title={menuItems.find(m=>m.id===activeTab)?.label}>
            <PlaceholderView title={menuItems.find(m=>m.id===activeTab)?.label} />
          </PageLayout>
        )}
      </main>

      {/* Mobile Nav Fix */}
      <div className="sm:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around p-2 z-40">
        {menuItems.map(item => (
           <button 
             key={item.id} 
             onClick={() => setActiveTab(item.id)}
             className={`flex flex-col items-center p-2 rounded ${activeTab === item.id ? 'text-[#bf0000]' : 'text-gray-400'}`}
           >
             <item.icon className="w-5 h-5" />
             <span className="text-[10px] mt-1">{item.label.split(' ')[0]}</span>
           </button>
        ))}
         <button 
           onClick={() => setActiveTab('config')}
           className={`flex flex-col items-center p-2 rounded ${activeTab === 'config' ? 'text-[#bf0000]' : 'text-gray-400'}`}
         >
           <Settings className="w-5 h-5" />
           <span className="text-[10px] mt-1">Config</span>
         </button>
      </div>
    </div>
  );
}