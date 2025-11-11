import express from "express";
import { verifyToken } from './middleware/verifyToken.js';
import { editarPerfil } from './controller/editar.js';
import { adicionarUsuario, loginUsuario, getUsuario, perfilOutroUsuario, nomeCriador } from './controller/usuarios.js';
import { adicionarPerson, personagens, IdPersonagem} from "./controller/person.js";
import { chatComPersonagem } from "./controller/conversarPerson.js";
import { listarSeguidores, deixarDeSeguir, seguirUsuario, listarSeguindo } from "./controller/seguir.js";

const router = express.Router();

// Cadastro de usuário
router.post('/cadastra', adicionarUsuario);

// Login de usuário
router.post('/entrar', loginUsuario);

// buscar os dados da própria conta do usuário
router.get('/usuario/:id', verifyToken, getUsuario);

// Editar perfil do usuário
router.put('/editar/:id', verifyToken, editarPerfil);

// Criar personagem (só usuários logados)
router.post('/criacao', verifyToken, adicionarPerson);

// Mostrar todos os personagens no menu
router.get('/personagens', personagens);

// Chat com personagem
router.post("/chat/:personagemId", chatComPersonagem);

// rota de buscar personagem pelo id
router.get('/personagens/:id', IdPersonagem)

// rota de mostra perfil de outro usuário
router.get('/perfil/:id', perfilOutroUsuario)

// rota para mostra o nome do criado do person
router.get('/nomeCriador/:id', nomeCriador)

// rota de seguir
router.post("/seguir", seguirUsuario);

// rota de deixar de seguir
router.post("/deixar-de-seguir", deixarDeSeguir);

// Listar seguidores / seguindo
router.get("/seguidores/:id", listarSeguidores);
router.get("/seguindo/:id", listarSeguindo);


export default router;
