import * as personService from '../services/personService.js';

export const buscar = async (req, res) => {
  const usuarioId = req.params.usuarioId || req.query.usuarioId;

  if (!usuarioId) {
    return res.status(400).json({ success: false, error: 'Parâmetro usuarioId é obrigatório (path ou query).' });
  }

  try {
    const personagens = await personService.getPersonagensPorUsuario(usuarioId);

    // Return empty array with 200 status if no characters found
    return res.status(200).json(personagens || []);
  } catch (err) {
    console.error('Erro ao carregar personagens do usuário', err);
    return res.status(500).json({ success: false, error: 'Erro ao carregar personagens do usuário.' });
  }
};

// rota de mostrar os dados de um personagem específico
export const getDataPerson = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Parâmetro id é obrigatório.' });
  }

  try {
    const personagem = await personService.getDataPersonById(id);

    if (!personagem) {
      return res.status(404).json({ success: false, error: 'Personagem não encontrado.' });
    }

    return res.json(personagem);
  } catch (err) {
    console.error('Erro ao buscar o personagem:', err);
    return res.status(500).json({ success: false, error: 'Erro interno ao buscar personagem.' });
  }
};

// rota para buscar personagem por nome
export const getSearchPerson = async (req, res) => {
  const { nomePersonagem } = req.query;

  if (!nomePersonagem) {
    return res.status(400).json({ success: false, error: 'O parâmetro nomePersonagem é obrigatório.' });
  }

  try {
    const resultados = await personService.getPersonSearchService(nomePersonagem);

    if (resultados.length === 0) {
      return res.status(404).json({ success: false, message: 'Nenhum personagem encontrado com esse nome.' });
    }

    return res.status(200).json({ success: true, resultados });
  } catch (err) {
    console.error('Erro ao buscar personagem:', err);
    return res.status(500).json({ success: false, error: 'Erro interno ao buscar personagem.' });
  }
};

// rota para editar personagem
export const updatePersonagem = async (req, res) => {
  const { id } = req.params;

  try {
    const personagemAtualizado = await personService.updatePersonService(id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Personagem atualizado com sucesso!',
      personagem_atualizado: personagemAtualizado
    });
  } catch (err) {
    console.error('Erro ao atualizar personagem:', err);

    if (err.message === 'PERSONAGEM_NAO_ENCONTRADO') {
      return res.status(404).json({
        success: false,
        error: 'Personagem não encontrado.'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erro interno ao atualizar personagem.'
    });
  }
};

export const personagens = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  try {
    const lista = await personService.getPersonagens(page, limit);
    return res.status(200).json(lista);
  } catch (err) {
    console.error('Erro ao buscar personagens completo:', err);
    return res.status(500).json({ error: 'Erro ao buscar personagens', details: err.message || err });
  }
};

// rota de criar personagem
export const createPerson = async (req, res) => {
  const { usuarioId } = req.params;

  try {
    const novoPersonagem = await personService.createPersonagem({ ...req.body, usuarioId });

    return res.status(201).json({
      success: true,
      message: 'Personagem criado com sucesso!',
      personagem: novoPersonagem
    });

  } catch (err) {
    console.error('Erro ao criar personagem:', err);
    return res.status(500).json({ success: false, error: 'Erro interno ao criar personagem.' });
  }
  
}

export const handleSaveRecentCharacter = async (req, res) => {
  try {
    const { usuarioId, personagemId } = req.params;

    if (isNaN(Number(usuarioId)) || isNaN(Number(personagemId))) {
      return res.status(400).json({ error: 'IDs inválidos.' });
    }

    await personService.saveRecentCharacterService(Number(usuarioId), Number(personagemId));

    return res.status(200).json({ success: true, message: 'Recente atualizado!' });
  } catch (error) {
    console.error('Erro ao salvar recente:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar personagem recente.' });
  }
};

// 2. Controller para BUSCAR (Gatilho do Perfil na aba recentes)
export const handleGetRecentCharacters = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    if (isNaN(Number(usuarioId))) {
      return res.status(400).json({ error: 'ID de usuário inválido.' });
    }

    const personagens = await personService.getRecentCharactersService(Number(usuarioId));

    return res.status(200).json(personagens);
  } catch (error) {
    console.error('Erro ao buscar recentes:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar personagens recentes.' });
  }
};