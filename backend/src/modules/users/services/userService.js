import * as userRepository from "../repositories/userRepository.js";
import * as cacheService from "../../../services/cacheService.js";

/**
 * CONFIGURAÇÃO DE CACHE
 * TTLs em segundos
 */
const CACHE_TTL = {
  USER_NAME: 30 * 60,       // 30 minutos para nomes de usuário (dados imutáveis)
  USER_PROFILE: 15 * 60,    // 15 minutos para perfil
};

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
export const getOtherUserService = async (id) => {

    const OtherUser = await userRepository.findDateOtherUserByid(id);
    
    if (!OtherUser) {
        throw new Error('User not found');
    }

    return OtherUser;
}

// Update user profile
export const editProfileService = async (id, profileData) => {
    const { nome, foto_perfil, descricao } = profileData || {};
    const trimmedName = nome?.toString().trim();

    if (!id) {
        throw new Error('ID_INVALIDO');
    }

    if (!trimmedName) {
        throw new Error('NOME_OBRIGATORIO');
    }

    const updateProfile = await userRepository.updateProfileUserById(id, {
        nome: trimmedName,
        foto_perfil: foto_perfil === undefined ? null : foto_perfil,
        descricao: descricao === undefined ? null : descricao
    });

    if (!updateProfile) {
        throw new Error('USUARIO_NAO_ENCONTRADO');
    }

    // Invalida cache do nome ao editar perfil
    await cacheService.cacheDel(`user:name:${id}`);

    return updateProfile;
}

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
    const frameUser = await userRepository.updateFrameUserById(usuarioId, frame);

    if (!frameUser) {
        throw new Error('USUARIO_NAO_ENCONTRADO');
    }

    await cacheService.cacheDel(`user:miniprofile:${usuarioId}`);
    await cacheService.cacheDel(`user:name:${usuarioId}`);
    await cacheService.cacheDel(`followers:${usuarioId}`);
    await cacheService.cacheDel(`following:${usuarioId}`);

    return frameUser;
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