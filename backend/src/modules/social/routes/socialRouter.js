import { Router } from "express";
import { getFavoritesUser, toggleFavorites } from "../controllers/favoritesController.js";
import { toggleLike, getLikesCount, getLikesByUsuario } from "../controllers/likeController.js";
import { verifyToken } from "../../../middleware/verifyToken.js";
import { socialLimiter } from "../../../middleware/rateLimiter.js";
import { followUser, unfollowUser, listFollowers, listFollowing } from "../services/followersService.js";

const router = Router();

// Apply rate limiter to all POST/DELETE routes
router.use(socialLimiter);

// Route to toggle favorite (add or remove)
router.post('/favorites/:usuario_id/:personagem_id', verifyToken, toggleFavorites);

// Route to list user's favorite characters
router.get('/favorites-by-user/:usuario_id', getFavoritesUser);


router.post('/toggle-like/:usuario_id/:personagem_id', verifyToken, toggleLike);

// Route to show the quantity of likes for a character
router.get('/likes-quantity/:personagem_id', getLikesCount);

// Route to show likes that the user has given (requires authentication)
router.get('/likes-by-user/:usuario_id', verifyToken, getLikesByUsuario);

// Route to follow a user
router.post('/follow', verifyToken, followUser);

// Route to unfollow a user
router.delete('/unfollow', verifyToken, unfollowUser);

// Route to list followers
router.get('/users/:id/followers', listFollowers);

// Route to list following users
router.get('/users/:id/following', listFollowing);

export default router;