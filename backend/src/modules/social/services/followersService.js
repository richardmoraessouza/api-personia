import * as followersRepository from '../repositories/followersRepository.js';
import * as cacheService from '../../../services/cacheService.js';

/**
 * CONFIGURAÇÃO DE CACHE
 * TTLs em segundos
 */
const CACHE_TTL = {
  FOLLOWERS: 10 * 60,    // 10 minutos - lista de seguidores é relativamente estável
  FOLLOWING: 10 * 60     // 10 minutos - lista de quem está seguindo
};

// ============================
// FOLLOW USER SERVICE - Add follower relationship
// Validates user cannot follow themselves
// ============================
export async function followUserService(seguidor_id, seguido_id) {
    if (Number(seguidor_id) === Number(seguido_id)) {
        throw new Error("VALIDATION_ERROR: You cannot follow yourself.");
    }
    
    const result = await followersRepository.insertFollower(seguidor_id, seguido_id);
    
    // Invalida caches relacionados
    await cacheService.cacheDel(`followers:${seguido_id}`);
    await cacheService.cacheDel(`following:${seguidor_id}`);
    
    return result;
}

// ============================
// UNFOLLOW USER SERVICE - Remove follower relationship
// ============================
export async function unfollowUserService(seguidor_id, seguido_id) {
    const result = await followersRepository.deleteFollower(seguidor_id, seguido_id);
    
    // Invalida caches relacionados
    await cacheService.cacheDel(`followers:${seguido_id}`);
    await cacheService.cacheDel(`following:${seguidor_id}`);
    
    return result;
}

// ============================
// LIST FOLLOWERS SERVICE - Get all followers of a user (com cache)
// ============================
export async function listFollowersService(usuario_id) {
    const cacheKey = `followers:${usuario_id}`;
    
    return await cacheService.cacheWithFallback(
        cacheKey,
        () => followersRepository.selectFollowers(usuario_id),
        CACHE_TTL.FOLLOWERS
    );
}

// ============================
// LIST FOLLOWING SERVICE - Get all users that a user is following (com cache)
// ============================
export async function listFollowingService(usuario_id) {
    const cacheKey = `following:${usuario_id}`;
    
    return await cacheService.cacheWithFallback(
        cacheKey,
        () => followersRepository.selectFollowing(usuario_id),
        CACHE_TTL.FOLLOWING
    );
}

// Controllers
export async function followUser(req, res) {
    try {
        const { seguidor_id, seguido_id } = req.body;
        await followUserService(seguidor_id, seguido_id);
        return res.status(201).json({ success: true, message: 'Following user' });
    } catch (err) {
        console.error('Error following:', err);
        return res.status(500).json({ error: err.message });
    }
}

export async function unfollowUser(req, res) {
    try {
        const { seguidor_id, seguido_id } = req.body;
        await unfollowUserService(seguidor_id, seguido_id);
        return res.status(200).json({ success: true, message: 'Unfollowed user' });
    } catch (err) {
        console.error('Error unfollowing:', err);
        return res.status(500).json({ error: err.message });
    }
}

export async function listFollowers(req, res) {
    try {
        const { id } = req.params;
        const seguidores = await listFollowersService(id);
        return res.status(200).json(seguidores);
    } catch (err) {
        console.error('Error listing followers:', err);
        return res.status(500).json({ error: err.message });
    }
}

export async function listFollowing(req, res) {
    try {
        const { id } = req.params;
        const seguindo = await listFollowingService(id);
        return res.status(200).json(seguindo);
    } catch (err) {
        console.error('Error listing following:', err);
        return res.status(500).json({ error: err.message });
    }
}