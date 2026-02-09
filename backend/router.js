import express from "express";
import { verifyToken } from './middleware/verifyToken.js';
import { editarPerfil, editaPerson, dadosPersonagem } from './controller/editarPerfil.js';
import { adicionarUsuario, loginUsuario, buscarGmail } from './controller/Cadastro.js';
import { getUsuario, perfilOutroUsuario, nomeCriador } from './controller/dadosUsuarios.js';
import { adicionarPerson, personagens, IdPersonagem } from './controller/person.js';
import { chatComPersonagem } from './controller/conversarPerson.js';
import { buscar } from './controller/BuscarPersonagens.js';
import { listarSeguidores, deixarDeSeguir, seguirUsuario, listarSeguindo } from './controller/seguir.js';
import { getLikes, toggleLike, getLikesByUsuario } from './controller/like.js';

const router = express.Router();

// Cadastro de usuário
router.post('/cadastra', adicionarUsuario);

// Rota para busca o gmail do usuário
router.get('/buscarUsuario/:gmail', buscarGmail)

// Busca o personagem do usuário
router.get('/buscarPerson/:usuarioId', buscar)

// Login de usuário
router.post('/entrar', loginUsuario);

// Buscar os dados da própria conta do usuário
router.get('/usuario/:id', verifyToken, getUsuario);

// Edita o personagem
router.put('/editarPerson/:id', editaPerson);

router.get('/dadosPersonagem/:id', dadosPersonagem);

// Editar perfil do usuário
router.put('/editar/:id', verifyToken, editarPerfil);

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

// Mostra o nome do criado do personagem
router.get('/nomeCriador/:id', nomeCriador)

// Seguir
router.post("/seguir", seguirUsuario);

// Deixar de seguir
router.post("/deixar-de-seguir", deixarDeSeguir);

// Listar seguidores / seguindo
router.get("/seguidores/:id", listarSeguidores);
router.get("/seguindo/:id", listarSeguindo);

// Adicionar ou remover like
router.post('/toggleLike/:usuario_id/:personagem_id', toggleLike);

// Contar os likes de um personagem
router.get('/likesQuantidade/:personagem_id', getLikes);

// Listar os likes de um usuário
router.get('/likesByUsuario/:usuario_id', getLikesByUsuario);
export default router;
