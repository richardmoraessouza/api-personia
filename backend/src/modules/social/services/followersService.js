import * as followersRepository from '../repositories/followersRepository.js';

// ============================
// FOLLOW USER SERVICE - Add follower relationship
// Validates user cannot follow themselves
// ============================
export async function followUserService(seguidor_id, seguido_id) {
    if (Number(seguidor_id) === Number(seguido_id)) {
        throw new Error("VALIDATION_ERROR: You cannot follow yourself.");
    }
    return await followersRepository.insertFollower(seguidor_id, seguido_id);
}

// ============================
// UNFOLLOW USER SERVICE - Remove follower relationship
// ============================
export async function unfollowUserService(seguidor_id, seguido_id) {
    return await followersRepository.deleteFollower(seguidor_id, seguido_id);
}

// ============================
// LIST FOLLOWERS SERVICE - Get all followers of a user
// ============================
export async function listFollowersService(usuario_id) {
    return await followersRepository.selectFollowers(usuario_id);
}

// ============================
// LIST FOLLOWING SERVICE - Get all users that a user is following
// ============================
export async function listFollowingService(usuario_id) {
    return await followersRepository.selectFollowing(usuario_id);
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