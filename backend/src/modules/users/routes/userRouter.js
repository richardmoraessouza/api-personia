import { Router } from "express";
import { getUsuario, getUser, getNameUser, getOtherUser, editProfile, getNameOtherUser} from "../controllers/userController.js";
import { verifyToken } from "../../../middleware/verifyToken.js";

const router = Router();

router.get("/searchUser",  getUsuario);

router.get("/user/:id", verifyToken, getUser);

router.get('/name-user/:id', getNameUser);

router.get('/other-user/:id', getOtherUser);

router.put('/edit-profile/:id', verifyToken, editProfile);

router.get(`/name-other-user/:usuarioId`, getNameOtherUser);



export default router;