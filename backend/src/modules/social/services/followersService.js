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

