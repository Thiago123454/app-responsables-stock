import React from 'react';
import { X, Download, Smartphone } from 'lucide-react';

const AndroidInstallPrompt = ({ onInstall, onClose }) => {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-500">
      <div className="bg-[#bf0000] text-white p-4 rounded-xl shadow-2xl border border-red-400 flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
        
        {/* Decoración de fondo */}
        <div className="absolute -right-4 -top-4 text-white/10 rotate-12">
            <Smartphone size={80} />
        </div>

        <div className="flex-1 z-10">
            <h3 className="font-bold text-lg flex items-center gap-2">
                <Download className="w-5 h-5" /> Instalar App
            </h3>
            <p className="text-red-100 text-sm mt-1">
                Instala la aplicación para acceder más rápido, usar pantalla completa y recibir actualizaciones.
            </p>
        </div>

        <div className="flex items-center gap-3 z-10 w-full sm:w-auto">
            <button 
                onClick={onInstall}
                className="flex-1 sm:flex-none bg-white text-[#bf0000] px-4 py-2.5 rounded-lg text-sm font-bold shadow-lg active:scale-95 transition-transform whitespace-nowrap"
            >
                Instalar Ahora
            </button>
            <button 
                onClick={onClose} 
                className="p-2 bg-red-800/50 hover:bg-red-800 rounded-lg text-white/80 hover:text-white transition-colors"
            >
                <X size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default AndroidInstallPrompt;