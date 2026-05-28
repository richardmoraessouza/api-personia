import * as personRepository from '../repositories/personRepository.js';
import { PERSONAGEM_RULES } from '../../../rules/personagemRules.js';

const caches = {
  byUsuario: new Map(),
  byId: new Map(),
  byNameSearch: new Map(),
  byList: new Map(),
  byRecent: new Map()
};

function setCache(map, key, value) {
  map.set(key, { value, expires: Date.now() + PERSONAGEM_RULES.CACHE_TTL });
}

function getCache(map, key) {
  const entry = map.get(key);
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    map.delete(key);
    return null;
  }
  return entry.value;
}

export const clearPersonCaches = () => {
  caches.byUsuario.clear();
  caches.byId.clear();
  caches.byNameSearch.clear();
  caches.byList.clear();
  caches.byList.clear();
  caches.byRecent.clear();
};

export const getPersonagensPorUsuario = async (usuarioId) => {
  const cached = getCache(caches.byUsuario, usuarioId);
  if (cached) {
    return cached;
  }

  const personagens = await personRepository.getPersonagensByUsuarioId(usuarioId);
  setCache(caches.byUsuario, usuarioId, personagens);
  return personagens;
};

// rota de mostrar os dados de um personagem específico
export const getDataPersonById = async (id) => {
  const cached = getCache(caches.byId, id);
  if (cached) {
    return cached;
  }

  const personagem = await personRepository.findDataPersonById(id);
  if (personagem) {
    setCache(caches.byId, id, personagem);
  }

  return personagem;
};

// rota para buscar personagem por nome
export const getPersonSearchService = async (nomePersonagem) => {
  const lowerTerm = nomePersonagem.toLowerCase();
  const cached = getCache(caches.byNameSearch, lowerTerm);
  if (cached) {
    return cached;
  }

  const resultados = await personRepository.searchPersonagensByNome(nomePersonagem);
  setCache(caches.byNameSearch, lowerTerm, resultados);
  return resultados;
};

// rota para editar personagem
export const updatePersonService = async (id, data) => {
  const figurinhas = Array.isArray(data.figurinhas)
    ? data.figurinhas.filter(Boolean)
    : data.figurinhas;

  const personagemAtualizado = await personRepository.updatePersonById(id, {
    ...data,
    figurinhas
  });

  if (!personagemAtualizado) {
    throw new Error(PERSONAGEM_RULES.PERSONAGEM_NAO_ENCONTRADO_ERROR);
  }

  clearPersonCaches();
  return personagemAtualizado;
};

export const getPersonagens = async (page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  const cacheKey = `${page}:${limit}`;
  const cached = getCache(caches.byList, cacheKey);
  if (cached) return cached;

  const personagens = await personRepository.getPersonagensPaginated(limit, offset);
  setCache(caches.byList, cacheKey, personagens);
  return personagens;
};

export const getPersonCreatedByUserService = async (id) => {
  const cached = getCache(caches.byUsuario, id);

  if (cached) {
    return cached;
  }

  const personagens = await personRepository.createPerson(id);
  setCache(caches.byUsuario, id, personagens);
  return personagens;
};

// rota para criar personagem
export const createPersonagem = async (data) => {
  const personagemCriado = await personRepository.createPerson(data);
  
  if (!personagemCriado) {
    throw new Error('ERRO_AO_CRIAR_PERSONAGEM');
  }

  clearPersonCaches();
  return personagemCriado;
};

// 1. Service para Salvar a Interação
export const saveRecentCharacterService = async (usuarioId, personagemId) => {
  if (!usuarioId || !personagemId) {
    throw new Error('PARAMETROS_INVALIDOS');
  }

  const resultado = await personRepository.saveRecentCharacter(usuarioId, personagemId);
  
  // Limpa o cache de recentes do usuário para forçar o sistema a buscar os dados novos no perfil
  caches.byRecent.delete(usuarioId); 
  
  return resultado;
};

// 2. Service para Buscar os 10 Recentes (com Cache)
export const getRecentCharactersService = async (usuarioId) => {
  if (!usuarioId) {
    throw new Error('USUARIO_NAO_INFORMADO');
  }

  // Tenta puxar do cache primeiro
  const cached = getCache(caches.byRecent, usuarioId);
  if (cached) {
    return cached;
  }

  // Busca do banco de dados através do repository
  const recentCharacters = await personRepository.findRecentCharacters(usuarioId);
  
  // Salva no cache antes de retornar
  setCache(caches.byRecent, usuarioId, recentCharacters);

  return recentCharacters;
};