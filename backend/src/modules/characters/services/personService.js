import * as personRepository from '../repositories/personRepository.js';

const CACHE_TTL = 60 * 1000;
const caches = {
  byUsuario: new Map(),
  byId: new Map(),
  byNameSearch: new Map(),
  byList: new Map()
};

function setCache(map, key, value) {
  map.set(key, { value, expires: Date.now() + CACHE_TTL });
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
    throw new Error('PERSONAGEM_NAO_ENCONTRADO');
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

export const createPersonagem = async (data) => {
  const personagemCriado = await personRepository.createPerson(data);
  
  if (!personagemCriado) {
    throw new Error('ERRO_AO_CRIAR_PERSONAGEM');
  }

  clearPersonCaches();
  return personagemCriado;
};