import { Router } from "express";
import { getUserById, getNameUser, getOtherUser, editProfile, getNameOtherUser} from "../controllers/userController.js";
import { verifyToken } from "../../../middleware/verifyToken.js";

const router = Router();

// ============================
// SEARCH USER - Find user by query
// ============================
// router.get("/searchUser",  getUsuario);

// ============================
// GET USER - Get authenticated user data
// ============================
router.get("/user/:id", verifyToken, getUserById);

// ============================
// GET USER NAME - Get user name by ID
// ============================
router.get('/name-user/:id', getNameUser);

// ============================
// GET OTHER USER - Get another user's public profile
// ============================
router.get('/other-user/:id', getOtherUser);

// ============================
// EDIT PROFILE - Update user profile information
// ============================
router.put('/edit-profile/:usuarioId', verifyToken, editProfile);

// ============================
// GET OTHER USER NAME - Get another user's name
// ============================
router.get(`/name-other-user/:usuarioId`, getNameOtherUser);



export default router;