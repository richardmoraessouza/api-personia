import * as userRepository from "../repositories/userRepository.js";
import * as cacheService from "../../../services/cacheService.js";
import { validateUsername } from "../../../utils/usernameValidation.js";

/**
 * CONFIGURAÇÃO DE CACHE
 * TTLs em segundos
 */
const CACHE_TTL = {
  USER_NAME: 30 * 60,
  USER_PROFILE: 15 * 60,
};

const MAX_XP_PER_REQUEST = 10000;

// Search user by ID
export const getUserById = async (id) => {
    const user = await userRepository.findUserById(id)

    if (!user) {
        throw new Error('User not found');
    }

    return user;
}

// Get user name by ID (com cache - nomes raramente mudam)
export const getNameUserService = async (usuarioId) => {
    const user = await userRepository.findUserById(usuarioId);
    if (!user) {
        throw new Error('ID_INVALIDO');
    }

    const cacheKey = `user:name:${usuarioId}`;

    return await cacheService.cacheWithFallback(
        cacheKey,
        () => userRepository.findNameUserById(usuarioId),
        CACHE_TTL.USER_NAME
    );
}

// Get another user's public profile data
export const getOtherUserService = async (identifier) => {

    const OtherUser = await userRepository.findDateOtherUserByid(identifier);

    if (!OtherUser) {
        throw new Error('User not found');
    }

    return OtherUser;
}

// update user profile
export const editProfileService = async (id, profileData) => {
    const { nome, foto_perfil, descricao, username, hide_favorite_character, hide_recent_character, hide_followers, hide_following } = profileData || {};

    const trimmedName = nome?.toString().trim();

    if (!id) {
        throw new Error('ID_INVALIDO');
    }

    if (nome !== undefined && !trimmedName) {
        throw new Error('NOME_OBRIGATORIO');
    }

    let normalizedUsername;

    if (username !== undefined) {
        normalizedUsername = validateUsername(username, { required: false });

        const existingUser =
            await userRepository.findUserByUsernameExceptSelf(normalizedUsername, id);

        if (existingUser) {
            const error = new Error('Esse username já está em uso.');
            error.statusCode = 409;
            throw error;
        }
    }

    const updateProfile = await userRepository.updateProfileUserById(id, {
        nome: nome === undefined ? null : trimmedName,
        foto_perfil: foto_perfil === undefined ? null : foto_perfil,
        descricao: descricao === undefined ? null : descricao,
        username: normalizedUsername === undefined ? null : normalizedUsername,
        hide_favorite_character: hide_favorite_character === undefined ? null : hide_favorite_character,
        hide_recent_character: hide_recent_character === undefined ? null : hide_recent_character,
        hide_followers: hide_followers === undefined ? null : hide_followers,
        hide_following: hide_following === undefined ? null : hide_following
    });

    if (!updateProfile) {
        throw new Error('USUARIO_NAO_ENCONTRADO');
    }

    await cacheService.cacheDel(`user:name:${id}`);

    return updateProfile;
};

// Get another user's name by ID (com cache)
export const getNameOtherUserService = async (usuarioId) => {
    if (!usuarioId || isNaN(usuarioId)) {
        throw new Error('ID_INVALIDO');
    }

    const cacheKey = `user:name:${usuarioId}`;

    return await cacheService.cacheWithFallback(
        cacheKey,
        () => userRepository.findNameOtherUser(usuarioId),
        CACHE_TTL.USER_NAME
    );
}

export const findNameOtherUser = async (usuarioId) => {
    const result = await db.query(
      `SELECT nome FROM personia2.usuarios WHERE id = $1`,
      [ usuarioId ]
    );

    return {
        nome: result.rows[0]?.nome || null
    };
}

// update frame user
export const updateFrameService = async (usuarioId, frame) => {
    const parsedUserId = Number(usuarioId);
    if (!parsedUserId || Number.isNaN(parsedUserId)) {
        throw new Error('ID_INVALIDO');
    }

    const normalizedFrame = frame === undefined || frame === null ? null : String(frame).trim();
    const finalFrame = normalizedFrame === '' ? null : normalizedFrame;

    if (finalFrame) {
        const allowedFrames = new Set(userRepository.getFrameUnlockCatalog().map(({ frameName }) => frameName));
        const unlockedFrames = await userRepository.getUnlockedFramesForUser(parsedUserId);

        if (!allowedFrames.has(finalFrame)) {
            throw new Error('FRAME_INVALIDA');
        }

        if (!unlockedFrames.includes(finalFrame)) {
            throw new Error('FRAME_NAO_DESBLOQUEADA');
        }
    }

    const frameUser = await userRepository.updateFrameUserById(parsedUserId, finalFrame);

    if (frameUser === undefined) {
        throw new Error('USUARIO_NAO_ENCONTRADO');
    }

    const unlockedFrames = await userRepository.getUnlockedFramesForUser(parsedUserId);

    await cacheService.cacheDel(`user:miniprofile:${parsedUserId}`);
    await cacheService.cacheDel(`user:name:${parsedUserId}`);
    await cacheService.cacheDel(`followers:${parsedUserId}`);
    await cacheService.cacheDel(`following:${parsedUserId}`);

    return { frame: frameUser, unlocked_frames: unlockedFrames };
}

// Shows user data in mini profile
export const getDataMiniProfileService = async (usuarioId) => {

    if (!usuarioId || isNaN(usuarioId)) {
        throw new Error('ID_INVALIDO');
    }

    const cacheKey = `user:miniprofile:${usuarioId}`;

    const miniProfile = await cacheService.cacheWithFallback(
        cacheKey,
        () => userRepository.findDataMiniProfile(usuarioId),
        CACHE_TTL.USER_PROFILE
    );

    if (!miniProfile) {
        throw new Error('USER_NOT_FOUND');
    }

    return miniProfile;
}

// search user level by ID
export const getLevelUserService = async (usuarioId) => {
    if (!usuarioId || isNaN(usuarioId)) {
        throw new Error('ID_INVALIDO');
    }

    const levelUser = await userRepository.findLevelUser(usuarioId);

    return levelUser ? levelUser.nivel : null;
}

// Search user xp by ID
export const getXpUserService = async (usuarioId) => {
    if (!usuarioId || isNaN(usuarioId)) {
        throw new Error('ID_INVALIDO');
    }

    const xpUser = await userRepository.findXpUser(usuarioId);

    return xpUser ? xpUser.xp : null;
}

// Add XP to user
export const addXpUserService = async (usuarioId, xpGanho) => {
  const parsedUserId = Number(usuarioId);
  const parsedXp = Number(xpGanho);

  if (!parsedUserId || Number.isNaN(parsedUserId)) throw new Error('ID_INVALIDO');
  if (!Number.isFinite(parsedXp) || parsedXp <= 0 || parsedXp > MAX_XP_PER_REQUEST) throw new Error('XP_INVALIDO');

  const updated = await userRepository.updateXpAndLevel(parsedUserId, parsedXp);

  if (!updated) throw new Error('USUARIO_NAO_ENCONTRADO');

  return updated;
};