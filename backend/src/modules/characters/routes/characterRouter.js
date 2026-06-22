import { Router } from "express";
import { updateCharacter, search, getDataCharacter, getSearchCharacter,
        createCharacter, handleSaveRecentCharacter,
        handleGetRecentCharacters, getCharacterProfile, countCharacterView,
        getExploreCharacters } from "../controllers/characterController.js";
import { verifyToken } from "../../../middleware/verifyToken.js";
import { 
  validateCharacterId, 
  validateUsuarioId,
  validateCharacterSearch,
  validateCreateCharacter,
  validateUpdateCharacter,
  validateRecentCharacter
} from "../../../middleware/inputValidators.js";

const router = Router();

/**
 * @swagger
 * /character/user-search-by-id/{usuarioId}:
 *   get:
 *     summary: Buscar personagens por ID do usuário
 *     tags:
 *       - Characters
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de personagens do usuário
 *       400:
 *         description: ID de usuário inválido
 */
// Get characters by user ID
router.get('/user-search-by-id/:usuarioId', validateUsuarioId, search);

/**
 * @swagger
 * /character/search-character:
 *   get:
 *     summary: Buscar personagem por nome
 *     tags:
 *       - Characters
 *     parameters:
 *       - in: query
 *         name: nome
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Personagem encontrado
 *       400:
 *         description: Parâmetro de busca inválido
 */
// Search character by name
router.get('/search-character', validateCharacterSearch, getSearchCharacter);

/**
 * @swagger
 * /character/explore:
 *   get:
 *     summary: Buscar personagens para explorar
 *     tags:
 *       - Characters
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número da página (opcional)
 *     responses:
 *       200:
 *         description: Lista de personagens (metade populares + metade novos)
 */
// Get characters for the Explore tab with pagination and division (Half Popular / Half New)
router.get('/explore', getExploreCharacters); 


/**
 * @swagger
 * /character/data-character-by-id/{id}:
 *   get:
 *     summary: Buscar personagem por ID
 *     tags:
 *       - Characters
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Personagem encontrado
 *         content:
 *           application/json:
 *             example:
 *               id: 45
 *               nome: Naruto
 *               bio: Ninja da folha
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Personagem não encontrado
 */
router.get("/data-character-by-id/:id",validateCharacterId, getDataCharacter);

/**
 * @swagger
 * /character/update-character/{id}:
 *   put:
 *     summary: Atualizar personagem (Requer autenticação)
 *     tags:
 *       - Characters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             nome: "Naruto Uzumaki"
 *             bio: "Hokage da aldeia da folha"
 *             imagem: "url_da_imagem"
 *     responses:
 *       200:
 *         description: Personagem atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Sem permissão para editar este personagem
 */
// Update character by ID (requires authentication)
router.put("/update-character/:id", verifyToken, validateUpdateCharacter, updateCharacter);

/**
 * @swagger
 * /character/create-character/{usuarioId}:
 *   post:
 *     summary: Criar novo personagem (Requer autenticação)
 *     tags:
 *       - Characters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             nome: "Novo Personagem"
 *             bio: "Descrição do personagem"
 *             imagem: "url_da_imagem"
 *     responses:
 *       201:
 *         description: Personagem criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
// Create new character (requires authentication)
router.post('/create-character/:usuarioId', verifyToken, validateCreateCharacter, createCharacter);

/**
 * @swagger
 * /character/recent-characters/{usuarioId}/{personagemId}:
 *   post:
 *     summary: Salvar personagem recente
 *     tags:
 *       - Characters
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: personagemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Personagem salvo no histórico recente
 *       400:
 *         description: IDs inválidos
 */
// Save recent character interaction (requires authentication)
router.post('/recent-characters/:usuarioId/:personagemId', validateRecentCharacter, handleSaveRecentCharacter);

/**
 * @swagger
 * /character/get-recent-characters/{usuarioId}:
 *   get:
 *     summary: Obter últimos 10 personagens visitados
 *     tags:
 *       - Characters
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista dos últimos 10 personagens
 *       400:
 *         description: ID de usuário inválido
 */
// Get list of 10 recent characters (requires authentication)
router.get('/get-recent-characters/:usuarioId', validateUsuarioId, handleGetRecentCharacters);

/**
 * @swagger
 * /character/character-views/{id}:
 *   get:
 *     summary: Obter histórico de visualizações do personagem (Requer autenticação)
 *     tags:
 *       - Characters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Histórico de visualizações
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Personagem não encontrado
 */
// Get character view history (requires authentication)
router.get('/character-views/:id', verifyToken, validateCharacterId, getCharacterProfile);

/**
 * @swagger
 * /character/increment-chat-views/{id}:
 *   post:
 *     summary: Incrementar contador de visualizações (Requer autenticação)
 *     tags:
 *       - Characters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Visualização incrementada
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Não autorizado
 */
// Count character views
router.post('/increment-chat-views/:id', verifyToken, validateCharacterId, countCharacterView);

export default router;