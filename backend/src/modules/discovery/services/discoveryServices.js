import * as discoveryRepository from '../repositories/discoveryRepository.js';
import * as cacheService from '../../../services/cacheService.js';

const CACHE_TTL = {
  POPULAR_WEEK: 2 * 60 * 60  // 2 horas
};

// Busca populares da semana (com cache)
export const getPopularWeekService = async () => {
  const cacheKey = 'discovery:popular:week';
  
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => discoveryRepository.findPopularWeek(),
    CACHE_TTL.POPULAR_WEEK
  );
};

export const getRecommendationsService = async (usuarioId) => {
  return await discoveryRepository.getRecommendationsByWeight(usuarioId);
};

// Correção da sua outra função caso você a use no futuro
export const getHomeFeed = async (usuarioId) => {
  // CORREÇÃO: Adicionado o "discoveryRepository." antes da função
  const recs = await discoveryRepository.getRecommendationsByWeight(usuarioId);
  
  if (!recs || recs.length === 0) {
    console.log("Usuário sem histórico. Buscando populares...");
    // CORREÇÃO: Adicionado o "discoveryRepository." antes da função
    return await discoveryRepository.findPopularWeek(); 
  }
  
  return recs;
};