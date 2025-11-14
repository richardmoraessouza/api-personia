import express from "express";
import { verifyToken } from './middleware/verifyToken.js';
import { editarPerfil } from './controller/editar.js';
import { adicionarUsuario, confirmarEmail, loginUsuario, validarTokenSenha, novaSenha, esqueciSenha,} from "./controller/Cadastro.js"
import { getUsuario, perfilOutroUsuario, nomeCriador } from './controller/dadosUsuarios.js';
import { adicionarPerson, personagens, IdPersonagem } from "./controller/person.js";
import { chatComPersonagem } from "./controller/conversarPerson.js";
import { listarSeguidores, deixarDeSeguir, seguirUsuario, listarSeguindo } from "./controller/seguir.js";

const router = express.Router();

// Cadastro de usuário
router.post('/cadastra', adicionarUsuario);

// Login de usuário
router.post('/entrar', loginUsuario);

// buscar os dados da própria conta do usuário
router.get('/usuario/:id', verifyToken, getUsuario);
router.post('/esqueci-senha', esqueciSenha);         // envia o e-mail
router.get('/resetar-senha', validarTokenSenha);     // valida token e redireciona front
router.post('/nova-senha', novaSenha);              // salva nova senha

// Editar perfil do usuário
router.put('/editar/:id', verifyToken, editarPerfil);
router.get('/confirmar-email', confirmarEmail); // Rota para confirmar o e-mail
// Criar personagem (só usuários logados)
router.post('/criacao', verifyToken, adicionarPerson);

// Mostrar todos os personagens no menu
router.get('/personagens', personagens);

// Chat com personagem
router.post("/chat/:personagemId", chatComPersonagem);

// Buscar personagem pelo id
router.get('/personagens/:id', IdPersonagem)

// Mostra perfil de outro usuário
router.get('/perfil/:id', perfilOutroUsuario)

// Mostra o nome do criado do person
router.get('/nomeCriador/:id', nomeCriador)

// Seguir
router.post("/seguir", seguirUsuario);

// Deixar de seguir
router.post("/deixar-de-seguir", deixarDeSeguir);

// Listar seguidores / seguindo
router.get("/seguidores/:id", listarSeguidores);
router.get("/seguindo/:id", listarSeguindo);


export default router;
