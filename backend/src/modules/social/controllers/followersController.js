import * as followersService from '../services/followersService.js';

// ============================
// FOLLOW - Add follower relationship (POST)
// ============================
// ✅ CORRIGIDO: Usa req.user.id do JWT (autenticado) em vez de body
export async function followUser(req, res) {
    try {
        // 🔒 SEGURANÇA: seguidor_id vem do JWT, não do body
        const seguidor_id = req.user.id;
        const { seguido_id } = req.body;

        if (!seguido_id) {
            return res.status(400).json({ 
                success: false, 
                error: 'seguido_id é obrigatório no body' 
            });
        }

        await followersService.followUserService(seguidor_id, seguido_id);
        return res.status(201).json({ success: true, message: 'Following user' });
    } catch (err) {
        if (err.message.includes('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        console.error('Error following:', err);
        return res.status(500).json({ error: err.message });
    }
}

// ============================
// UNFOLLOW - Remove follower relationship (DELETE)
// ============================
// ✅ CORRIGIDO: Usa req.user.id do JWT (autenticado) em vez de body
export async function unfollowUser(req, res) {
    try {
        // 🔒 SEGURANÇA: seguidor_id vem do JWT, não do body
        const seguidor_id = req.user.id;
        const { seguido_id } = req.body;

        if (!seguido_id) {
            return res.status(400).json({ 
                success: false, 
                error: 'seguido_id é obrigatório no body' 
            });
        }

        await followersService.unfollowUserService(seguidor_id, seguido_id);
        return res.status(200).json({ success: true, message: 'Unfollowed user' });
    } catch (err) {
        console.error('Error unfollowing:', err);
        return res.status(500).json({ error: err.message });
    }
}

// ============================
// LIST FOLLOWERS - Get all followers of a user (GET)
// ============================
export async function listFollowers(req, res) {
    try {
        const { id } = req.params;
        const seguidores = await followersService.listFollowersService(id);
        return res.status(200).json(seguidores);
    } catch (err) {
        console.error('Error listing followers:', err);
        return res.status(500).json({ error: err.message });
    }
}

// ============================
// LIST FOLLOWING - Get users that this user follows (GET)
// ============================
export async function listFollowing(req, res) {
    try {
        const { id } = req.params;
        const seguindo = await followersService.listFollowingService(id);
        return res.status(200).json(seguindo);
    } catch (err) {
        console.error('Error listing following:', err);
        return res.status(500).json({ error: err.message });
    }
}
