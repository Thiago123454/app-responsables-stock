import React, { useState } from 'react';
import { Clock, Bug } from 'lucide-react';
import Button from '../ui/Button';
import PageLayout from '../ui/PageLayout';

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

export default SettingsView;