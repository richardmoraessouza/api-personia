import * as followersRepository from '../repository/followersRepository.js';

export async function follow(req, res) {
    const { seguidor_id, seguido_id } = req.body;

    try {
        await followersRepository.insertSeguidor(seguidor_id, seguido_id);
        return res.json({ success: true, message: "Agora você está seguindo este usuário!" });
    } catch (error) {
        if (error.message.startsWith("VALIDATION_ERROR:")) {
            return res.status(400).json({ success: false, error: error.message.replace("VALIDATION_ERROR: ", "") });
        }
        console.error("Erro ao seguir usuário:", error);
        return res.status(500).json({ success: false, error: "Erro interno ao seguir usuário." });
    }
}

export async function unfollow(req, res) {
    const { seguidor_id, seguido_id } = req.body;

    try {
        await followersRepository.deleteSeguidor(seguidor_id, seguido_id);
        return res.json({ success: true, message: "Você deixou de seguir este usuário." });
    } catch (error) {
        console.error("Erro ao deixar de seguir:", error);
        return res.status(500).json({ success: false, error: "Erro interno ao deixar de seguir usuário." });
    }
}

export async function listFollowers(req, res) {
    const { id } = req.params;

    try {
        const seguidores = await followersRepository.selectSeguidores(id);
        return res.json({ success: true, seguidores });
    } catch (error) {
        console.error("Erro ao listar seguidores:", error);
        return res.status(500).json({ success: false, error: "Erro interno ao listar seguidores." });
    }
}

export async function listFollowing(req, res) {
    const { id } = req.params;

    try {
        const seguindo = await followersRepository.selectSeguindo(id);
        return res.json({ success: true, seguindo });
    } catch (error) {
        console.error("Erro ao listar seguindo:", error);
        return res.status(500).json({ success: false, error: "Erro interno ao listar seguindo." });
    }
}