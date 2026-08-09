import { Router } from "express";
import { getUserById, getNameUser, getOtherUser, 
        editProfile, getNameOtherUser, getDataMiniProfile, updateFrame,
        getLevelUser, getFrameUnlocks,
        getXpUser
       } from "../controllers/userController.js";
import { verifyToken } from "../../../middleware/verifyToken.js";

const router = Router();

// ============================
// SEARCH USER - Find user by query
// ============================
// router.get("/searchUser",  getUsuario);

router.get("/user/:id", verifyToken, getUserById);

router.get('/name-user/:id', getNameUser);

router.get('/other-user/:id', getOtherUser);

router.put('/edit-profile/:usuarioId', verifyToken, editProfile);

router.get(`/name-other-user/:usuarioId`, getNameOtherUser);

router.get(`/mini-profile/:usuarioId`, getDataMiniProfile);

router.put(`/update-frame/:usuarioId`, verifyToken, updateFrame )

router.get(`/level-user/:usuarioId`, verifyToken, getLevelUser )

router.get(`/frame-unlocks/:usuarioId`, verifyToken, getFrameUnlocks )

// Search user xp by ID
router.get('/xp-user/:usuarioId', verifyToken, getXpUser )

export default router;
