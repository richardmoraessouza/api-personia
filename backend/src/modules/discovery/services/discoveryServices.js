import * as discoveryRepository from '../repositories/discoveryRepository.js';
import * as cacheService from '../../../services/cacheService.js';

/**
 * CONFIGURAÇÃO DE CACHE
 * TTLs em segundos
 */
const CACHE_TTL = {
  POPULAR_WEEK: 2 * 60 * 60  // 2 horas - Popular da semana muda pouquíssimas vezes
};

/**
 * Popular da semana é uma das operações mais críticas
 * Cacheia por 2h para evitar queries desnecessárias
 */
export const getPopularWeekService = async () => {
  const cacheKey = 'discovery:popular:week';
  
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => discoveryRepository.findPopularWeek(),
    CACHE_TTL.POPULAR_WEEK
  );
};