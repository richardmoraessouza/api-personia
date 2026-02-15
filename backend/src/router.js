import express from "express";
import { verifyToken } from "./middleware/verifyToken.js";
import { editaPerson, deletaPerson } from './controller/person/editar_deletar.controller.js';
import { editarPerfil } from './controller/User/UserEditarPerfil.controller.js';
import { adicionarUsuario, loginUsuario, buscarGmail } from './controller/User/cadastro.controller.js';
import { getUsuario, perfilOutroUsuario, nomeCriador } from './controller/User/dadosUsuarios.controller.js';
import { adicionarPerson, personagens, IdPersonagem } from './controller/person/person.controller.js';
import { chatComPersonagem } from './controller/chat_IA/conversarPerson.js';
import { buscar, dadosPersonagem, buscarPersonagem } from './controller/person/buscar_person_User.controller.js';
import { favoritos, getFavoritosFull } from "./controller/social/favoritos.controller.js";
import { listarSeguidores, deixarDeSeguir, seguirUsuario, listarSeguindo } from './controller/User/seguir.controller.js';
import { getLikes, toggleLike, getLikesByUsuario } from './controller/social/like.controller.js';
import { buscarUser } from "./controller/User/buscar_user.controller.js";

const router = express.Router();

// ------------------ ROTAS DE BUSCA ------------------
router.get('/buscarPersonagem', buscarPersonagem);
router.get('/buscarUser', buscarUser);

// ------------------ ROTAS DE USUÁRIO ------------------
router.post('/cadastra', adicionarUsuario);
router.post('/entrar', loginUsuario);
router.get('/buscarUsuario/:gmail', buscarGmail);
router.get('/usuario/:id', verifyToken, getUsuario);
router.put('/editar/:id', verifyToken, editarPerfil);
router.get('/perfil/:id', perfilOutroUsuario);

// ------------------ ROTAS DE PERSONAGEM ------------------
router.post('/criacao', verifyToken, adicionarPerson);
router.get('/personagens', personagens);
router.get('/buscarPerson/:usuarioId', buscar);
router.get('/dadosPersonagem/:id', dadosPersonagem);
router.get('/nomeCriador/:id', nomeCriador);
router.put('/editarPerson/:id', verifyToken, editaPerson);
router.delete('/deletePerson/:id', verifyToken, deletaPerson);
router.get('/personagens/:id', IdPersonagem); 

// ------------------ SOCIAL ------------------
router.post("/seguir", verifyToken, seguirUsuario);
router.post("/deixar-de-seguir", verifyToken, deixarDeSeguir);
router.get("/seguidores/:id", listarSeguidores);
router.get("/seguindo/:id", listarSeguindo);

router.post('/toggleLike/:usuario_id/:personagem_id', verifyToken, toggleLike);
router.get('/likesQuantidade/:personagem_id', getLikes);
router.get('/likesByUsuario/:usuario_id', getLikesByUsuario);

router.post('/favoritos/:usuario_id/:personagem_id', verifyToken, favoritos);
router.get('/getFavoritosByUsuario/:usuario_id', getLikesByUsuario);
router.get('/getFavoritosFull/:usuarioId', getFavoritosFull);

// ------------------ CHAT IA ------------------
router.post("/chat/:personagemIdAtual", chatComPersonagem);


export default router;
