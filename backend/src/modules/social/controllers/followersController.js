import * as followersRepository from '../repository/followersRepository.js';

// ============================
// FOLLOW - Add follower relationship (POST)
// Sends follower_id and followed_id in request body
// ============================
export async function follow(req, res) {
    const { seguidor_id, seguido_id } = req.body;

    try {
        await followersRepository.insertFollower(seguidor_id, seguido_id);
        return res.json({ success: true, message: "You are now following this user!" });
    } catch (error) {
        if (error.message.startsWith("VALIDATION_ERROR:")) {
            return res.status(400).json({ success: false, error: error.message.replace("VALIDATION_ERROR: ", "") });
        }
        console.error("Error following user:", error);
        return res.status(500).json({ success: false, error: "Internal error while following user." });
    }
}

// ============================
// UNFOLLOW - Remove follower relationship (POST)
// Sends follower_id and followed_id in request body
// ============================
export async function unfollow(req, res) {
    const { seguidor_id, seguido_id } = req.body;

    try {
        await followersRepository.deleteFollower(seguidor_id, seguido_id);
        return res.json({ success: true, message: "You are no longer following this user." });
    } catch (error) {
        console.error("Error unfollowing user:", error);
        return res.status(500).json({ success: false, error: "Internal error while unfollowing user." });
    }
}

// ============================
// LIST FOLLOWERS - Get followers of a user (GET)
// Returns list of users following this user
// ============================
export async function listFollowers(req, res) {
    const { id } = req.params;

    try {
        const seguidores = await followersRepository.selectFollowers(id);
        return res.json({ success: true, seguidores });
    } catch (error) {
        console.error("Error listing followers:", error);
        return res.status(500).json({ success: false, error: "Internal error while listing followers." });
    }
}

// ============================
// LIST FOLLOWING - Get users that this user follows (GET)
// Returns list of users that this user is following
// ============================
export async function listFollowing(req, res) {
    const { id } = req.params;

    try {
        const seguindo = await followersRepository.selectFollowing(id);
        return res.json({ success: true, seguindo });
    } catch (error) {
        console.error("Error listing following:", error);
        return res.status(500).json({ success: false, error: "Internal error while listing following." });
    }
}