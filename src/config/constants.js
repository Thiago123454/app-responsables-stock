// Definición de Productos y Colores
export const PRODUCTS = [
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

// Orden lógico del flujo
export const SECTOR_ORDER = ['depoSala1', 'deposito', 'puerta', 'candy', 'desperdicio'];

// Sectores
export const SECTORS = [
  { id: 'depoSala1', name: 'Depo Sala 1', type: 'cajas' },
  { id: 'deposito', name: 'Deposito', type: 'unidades' },
  { id: 'puerta', name: 'Puerta', type: 'unidades' },
  { id: 'candy', name: 'Candy', type: 'unidades' },
  { id: 'desperdicio', name: 'Desperdicio', type: 'unidades' },
];

// Tipos de movimientos
export const MOVEMENTS_TYPES = [
  { id: 'move_1', label: 'Depo sala1 a Deposito', subLabel: '(En cajas)', source: 'depoSala1', target: 'deposito', unit: 'Cajas' },
  { id: 'move_2', label: 'Deposito a Puerta', subLabel: '(Unidades)', source: 'deposito', target: 'puerta', unit: 'Unidades' },
  { id: 'move_3', label: 'Puerta a Candy', subLabel: '(Unidades)', source: 'puerta', target: 'candy', unit: 'Unidades' },
  { id: 'move_4', label: 'Candy a Desperdicio', subLabel: '(Unidades)', source: 'candy', target: 'desperdicio', unit: 'Unidades' },
];