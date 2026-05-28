import { Router } from "express";
import { updatePersonagem, buscar, getDataPerson, getSearchPerson, personagens, createPerson, handleSaveRecentCharacter, handleGetRecentCharacters} from "../controllers/personController.js";
import { verifyToken } from "../../../middleware/verifyToken.js";

const router = Router();

// rota para mostrar os personagens de um usuário
router.get('/user-search-by-id/:usuarioId', buscar);

// rota de pesquisar personagem por nome
router.get('/search-character', getSearchPerson);

// rota para mostrar todos os personagens
router.get('/explore', personagens);

// rota de mostrar os dados de um personagem específico
router.get('/data-character/:id', getDataPerson);

// rota para editar personagem
router.put("/update-character/:id", verifyToken, updatePersonagem);

// rota de criar personagem
router.post('/create-character/:usuarioId', verifyToken, createPerson);

// 🚀 ROTA 1: Salva o personagem recente (Disparada no chat/App.tsx)
// Mapeia o POST do Axios passando os dois parâmetros
router.post('/recent-characters/:usuarioId/:personagemId', handleSaveRecentCharacter);

// 🔍 ROTA 2: Busca a lista de 10 personagens recentes (Disparada na aba do Perfil)
// Mapeia o GET passando apenas o usuarioId
router.get('/get-recent-characters/:usuarioId', handleGetRecentCharacters);

export default router;