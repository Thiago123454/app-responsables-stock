import React from 'react';
import { X, Share, PlusSquare } from 'lucide-react';

const IosInstallPrompt = ({ onClose }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-800 text-sm">📲 Instalar App en iPhone</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          Para una mejor experiencia y pantalla completa, instala la web como App:
        </p>
        <div className="flex flex-col gap-2 text-xs font-medium text-gray-700">
          <div className="flex items-center gap-2">
            1. Toca el botón compartir <Share size={14} className="text-blue-500" /> abajo.
          </div>
          <div className="flex items-center gap-2">
            2. Busca y selecciona <span className="bg-gray-100 px-1 py-0.5 rounded border border-gray-300 flex items-center gap-1"> <PlusSquare size={12} /> Agregar a Inicio</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IosInstallPrompt;