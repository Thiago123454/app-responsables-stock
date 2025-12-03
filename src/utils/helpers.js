import { SECTOR_ORDER, MOVEMENTS_TYPES } from '../config/constants';

export const getIntermediateMoves = (fromId, toId) => {
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