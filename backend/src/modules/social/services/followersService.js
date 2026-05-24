import * as followersRepository from '../repositories/followersRepository.js';

export async function followUserService(seguidor_id, seguido_id) {
    if (Number(seguidor_id) === Number(seguido_id)) {
        throw new Error("VALIDATION_ERROR: Você não pode seguir a si mesmo.");
    }
    return await followersRepository.insertFollower(seguidor_id, seguido_id);
}

export async function unfollowUserService(seguidor_id, seguido_id) {
    return await followersRepository.deleteFollower(seguidor_id, seguido_id);
}

export async function listFollowersService(usuario_id) {
    return await followersRepository.selectFollowers(usuario_id);
}

export async function listFollowingService(usuario_id) {
    return await followersRepository.selectFollowing(usuario_id);
}

// Controllers
export async function followUser(req, res) {
    try {
        const { seguidor_id, seguido_id } = req.body;
        await followUserService(seguidor_id, seguido_id);
        return res.status(201).json({ success: true, message: 'Seguindo usuário' });
    } catch (err) {
        console.error('Erro ao seguir:', err);
        return res.status(500).json({ error: err.message });
    }
}

export async function unfollowUser(req, res) {
    try {
        const { seguidor_id, seguido_id } = req.body;
        await unfollowUserService(seguidor_id, seguido_id);
        return res.status(200).json({ success: true, message: 'Deixou de seguir' });
    } catch (err) {
        console.error('Erro ao deixar de seguir:', err);
        return res.status(500).json({ error: err.message });
    }
}

export async function listFollowers(req, res) {
    try {
        const { id } = req.params;
        const seguidores = await listFollowersService(id);
        return res.status(200).json(seguidores);
    } catch (err) {
        console.error('Erro ao listar seguidores:', err);
        return res.status(500).json({ error: err.message });
    }
}

export async function listFollowing(req, res) {
    try {
        const { id } = req.params;
        const seguindo = await listFollowingService(id);
        return res.status(200).json(seguindo);
    } catch (err) {
        console.error('Erro ao listar seguindo:', err);
        return res.status(500).json({ error: err.message });
    }
}