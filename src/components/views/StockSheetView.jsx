import React from 'react';
import { RotateCcw } from 'lucide-react';
import { SECTORS, MOVEMENTS_TYPES, PRODUCTS } from '../../config/constants';
import Button from '../ui/Button';
import PageLayout from '../ui/PageLayout';

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

export default StockSheetView;