import React, { useState, useEffect } from 'react';
import { Home, ArrowRightLeft, Mail, Send, Settings, Zap, Wifi, WifiOff, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

// Hooks Personalizados
import { useAuth } from './hooks/useAuth';
import { useStockData } from './hooks/useStockData';
import { useDailyReset } from './hooks/useDailyReset';

// Componentes
import PageLayout from './components/ui/PageLayout';
import SettingsView from './components/views/SettingsView';
import QuickMovementsView from './components/views/QuickMovementsView';
import StockSheetView from './components/views/StockSheetView';
import HomeView from './components/views/HomeView'; // <-- Nuevo Import

// Prompts de Instalación (PWA)
import IosInstallPrompt from './components/ui/IosInstallPrompt';
import AndroidInstallPrompt from './components/ui/AndroidInstallPrompt';

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

export default function StockApp() {
  const [activeTab, setActiveTab] = useState('rapidos'); 
  
  // --- LÓGICA DE INSTALACIÓN PWA (Android & iOS) ---
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  
  // Estados para Android
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);

  useEffect(() => {
    // 1. Detectar Entorno
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    
    setIsIos(ios);
    setIsStandalone(standalone);

    // 2. Lógica iOS: Si es iPhone y no está instalada, mostrar prompt visual
    if (ios && !standalone) {
        // Pequeño delay para no ser intrusivo al cargar
        setTimeout(() => setShowIosPrompt(true), 3000);
    }

    // 3. Lógica Android: Escuchar evento de instalación
    const handleBeforeInstallPrompt = (e) => {
      // Prevenir que Chrome muestre su mini-infobar automáticamente
      e.preventDefault();
      // Guardar el evento para dispararlo después con nuestro botón
      setDeferredPrompt(e);
      // Mostrar nuestro componente visual
      setShowAndroidPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleAndroidInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Ocultar nuestro prompt visual
    setShowAndroidPrompt(false);
    
    // Mostrar el prompt nativo del sistema
    deferredPrompt.prompt();
    
    // Esperar a ver qué decidió el usuario
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // Ya no podemos usar este evento, lo limpiamos
    setDeferredPrompt(null);
  };
  // ------------------------------------------------------------------

  // 1. Hook de Autenticación
  const { user, authError } = useAuth();
  
  // 2. Hook de Lógica de Datos
  const { 
    stockState, previousDayStock, history, config, 
    updateStock, undoTransaction, updateConfig 
  } = useStockData(user);

  // 3. Hook de Proceso en Segundo Plano (Reset)
  const { isResetting, shouldBlockApp } = useDailyReset(user, config);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col relative">
      
      {/* OVERLAY DE BLOQUEO */}
      {shouldBlockApp && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-[#bf0000]">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center animate-in zoom-in duration-300">
             <Loader2 className="w-10 h-10 animate-spin mb-3" />
             <h3 className="text-lg font-bold text-gray-800">
               {isResetting ? 'Realizando Cierre Diario...' : 'Sincronizando Fecha...'}
             </h3>
             <p className="text-sm text-gray-500 mt-1">Por favor espere un momento.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#bf0000] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-white/10 p-1.5 rounded text-white font-black tracking-tighter">MX</div>
             <span className="font-bold text-lg hidden sm:block">MULTIPLEX</span>
          </div>
          
          <nav className="hidden md:flex space-x-1 flex-1 justify-center">
             {menuItems.map(item => (
               <button 
                 key={item.id}
                 onClick={() => setActiveTab(item.id)}
                 className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === item.id ? 'bg-white text-[#bf0000] font-medium shadow' : 'hover:bg-white/10'}`}
               >
                 <item.icon className="w-4 h-4" />
                 <span className="hidden sm:inline">{item.label}</span>
               </button>
             ))}
             <button onClick={() => setActiveTab('config')} className={`px-3 py-2 rounded-lg ${activeTab === 'config' ? 'bg-white text-[#bf0000]' : 'hover:bg-white/10'}`}>
               <Settings className="w-4 h-4" />
             </button>
          </nav>

          <div className="flex items-center gap-3">
             {authError ? (
               <div className="bg-red-600 px-2 py-1 rounded text-xs font-bold animate-pulse flex gap-1"><WifiOff className="w-3 h-3" /> Error</div>
             ) : user ? (
               <div className="bg-green-600/50 px-2 py-1 rounded text-xs font-bold text-green-100 flex gap-1"><Wifi className="w-3 h-3" /> Online</div>
             ) : (
               <div className="bg-yellow-600/50 px-2 py-1 rounded text-xs font-bold text-yellow-100 flex gap-1"><AlertTriangle className="w-3 h-3" /> Conectando</div>
             )}
             <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold border-2 border-white">AD</div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-6">
        {activeTab === 'rapidos' && (
          <QuickMovementsView 
            stockState={stockState} 
            history={history}
            onUpdateStock={updateStock} 
            onUndo={undoTransaction}
          />
        )}
        {activeTab === 'movimiento' && (
          <StockSheetView stockState={stockState} previousDayStock={previousDayStock} />
        )}
        {activeTab === 'home' && (
            <HomeView user={user} /> 
        )}
        {activeTab === 'config' && (
          <SettingsView config={config} onSaveConfig={updateConfig} />
        )}
        {!['rapidos', 'movimiento', 'home', 'config'].includes(activeTab) && (
          <PageLayout title={menuItems.find(m=>m.id===activeTab)?.label}>
            <PlaceholderView title={menuItems.find(m=>m.id===activeTab)?.label} />
          </PageLayout>
        )}
      </main>
      
      {/* Navegación Móvil */}
      <div className="sm:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around p-2 z-40 safe-area-bottom">
        {[...menuItems, { id: 'config', label: 'Config', icon: Settings }].map(item => (
           <button 
             key={item.id} 
             onClick={() => setActiveTab(item.id)}
             className={`flex flex-col items-center p-2 rounded ${activeTab === item.id ? 'text-[#bf0000]' : 'text-gray-400'}`}
           >
             <item.icon className="w-5 h-5" />
             <span className="text-[10px] mt-1">{item.label.split(' ')[0]}</span>
           </button>
        ))}
      </div>

      {/* --- PROMPTS DE INSTALACIÓN --- */}
      
      {/* 1. Android / Desktop Chrome */}
      {showAndroidPrompt && (
         <AndroidInstallPrompt 
            onInstall={handleAndroidInstallClick} 
            onClose={() => setShowAndroidPrompt(false)} 
         />
      )}

      {/* 2. iOS */}
      {showIosPrompt && (
         <IosInstallPrompt 
            onClose={() => setShowIosPrompt(false)} 
         />
      )}
      
    </div>
  );
}