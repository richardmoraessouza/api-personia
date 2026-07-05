import db from '../../../config/db.js';

const FRAME_UNLOCKS = [
  { requiredLevel: 5, frameName: 'cat' },
  { requiredLevel: 5, frameName: 'cyberpunk' },
  { requiredLevel: 10, frameName: 'foxy' },
  { requiredLevel: 20, frameName: 'rainbow' },
  { requiredLevel: 35, frameName: 'dark' },
  { requiredLevel: 35, frameName: 'diamond' },
  { requiredLevel: 88, frameName: 'horror' },
];

export const FindByid = async (id) => {
    const result = await db.query(`
        SELECT id, nome, foto_perfil, descricao, username
        FROM personia2.usuarios
        WHERE id = $1
        `, [id]);

    return result.rows[0];
}

// Search user by ID
export const findUserById = async (id) => {
    const result = await db.query(`
        SELECT id, nome, foto_perfil, descricao, username
        FROM personia2.usuarios WHERE id = $1
    `, [id]);
    return result.rows[0];
}

// Get user profile data by ID (used on session restore)
export const findNameUserById = async (userId) => {
    const result = await db.query(`
        SELECT nome, foto_perfil, descricao, frame, username
        FROM personia2.usuarios
        WHERE id = $1
        `, [userId]);

    if (result.rows.length === 0) return null;

    return result.rows[0];
}

// Get another user's public profile data by username
export const findUserByIdentifier = async (identifier) => {
    const rawIdentifier = identifier === undefined || identifier === null ? '' : String(identifier);
    const normalizedIdentifier = rawIdentifier.trim();

    if (!normalizedIdentifier) {
        return null;
    }

    const result = await db.query(`
        SELECT id, nome, foto_perfil, descricao, frame, username
        FROM personia2.usuarios
        WHERE LOWER(username) = LOWER($1)
        LIMIT 1
    `, [normalizedIdentifier]);

    return result.rows[0] || null;
};

export const findDateOtherUserByid = async (identifier) => {
    return findUserByIdentifier(identifier);
}

// Update user profile information by ID
export const findUserByUsernameExceptSelf = async (username, userId) => {
    const query = `
        SELECT id
        FROM personia2.usuarios
        WHERE LOWER(username) = LOWER($1)
          AND id != $2
        LIMIT 1
    `;

    const result = await db.query(query, [username, userId]);
    return result.rows[0];
};

export const updateProfileUserById = async (id, {nome, foto_perfil, descricao, username}) => {
    const updateQuery = `
        UPDATE personia2.usuarios
        SET
            nome = COALESCE(NULLIF($1::text, ''), nome),
            foto_perfil = COALESCE($2::text, foto_perfil),
            descricao = COALESCE($3::text, descricao),
            username = COALESCE(NULLIF($5::text, ''), username)
        WHERE id = $4
    `;

    await db.query(updateQuery, [nome, foto_perfil, descricao, id, username]);

    const selectQuery = `
        SELECT id, nome, foto_perfil, descricao, username
        FROM personia2.usuarios
        WHERE id = $1
    `;

    const result = await db.query(selectQuery, [id]);

    return result.rows[0] || null;
}

export const getFrameUnlockCatalog = () => FRAME_UNLOCKS;

export const getUnlockedFramesForUser = async (usuarioId) => {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const userLevelResult = await client.query(`
            SELECT nivel
            FROM personia2.usuarios
            WHERE id = $1
        `, [usuarioId]);

        const currentLevel = Number(userLevelResult.rows[0]?.nivel ?? 1) || 1;

        await syncUnlockedFramesInConnection(client, usuarioId, currentLevel);

        const result = await client.query(`
            SELECT frame_name
            FROM personia2.user_unlocked_frames
            WHERE user_id = $1
            ORDER BY required_level, frame_name
        `, [usuarioId]);

        await client.query('COMMIT');

        return result.rows.map((row) => row.frame_name);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const syncUnlockedFramesInConnection = async (client, usuarioId, currentLevel) => {
    const existingResult = await client.query(`
        SELECT frame_name FROM personia2.user_unlocked_frames WHERE user_id = $1
    `, [usuarioId]);

    const unlockedSet = new Set(existingResult.rows.map((row) => row.frame_name));
    const toInsert = FRAME_UNLOCKS.filter(({ requiredLevel, frameName }) => {
        return currentLevel >= requiredLevel && !unlockedSet.has(frameName);
    });

    if (toInsert.length > 0) {
        await Promise.all(toInsert.map(({ frameName, requiredLevel }) => client.query(`
            INSERT INTO personia2.user_unlocked_frames (user_id, frame_name, required_level)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, frame_name) DO NOTHING
        `, [usuarioId, frameName, requiredLevel])));
    }

    return toInsert.map(({ frameName, requiredLevel }) => ({ frame_name: frameName, required_level: requiredLevel }));
};

// update frame user
export const updateFrameUserById = async (usuarioId, frame) => {
    const result = await db.query(`
        UPDATE personia2.usuarios
        SET frame = NULLIF(TRIM($2::text), '')
        WHERE id = $1
        RETURNING frame
    `, [usuarioId, frame ?? '']);

    if (result.rowCount === 0) {
        return undefined;
    }

    return result.rows[0]?.frame ?? null;
}

// Get another user's name by ID
export const findNameOtherUser = async (usuarioId) => {
    const id = parseInt(usuarioId, 10);

    if (isNaN(id)) {
        throw new Error('ID_INVALIDO');
    }

    const result = await db.query(
      `SELECT nome FROM personia2.usuarios WHERE id = $1`,
      [ id ]
    );

    if (!result.rows || result.rows.length === 0) {
        return { nome: null };
    }

    return {
        nome: result.rows[0].nome || null
    };
}

// Shows user data in mini profile
export const findDataMiniProfile = async (usuarioId) => {
    const result = await db.query(`
        SELECT id, nome, foto_perfil, descricao, frame, username, is_online, nivel, xp
        FROM personia2.usuarios
        WHERE id = $1
    `, [usuarioId]);

    const user = result.rows[0] || null;
    if (!user) return null;

    const unlockedFrames = await getUnlockedFramesForUser(usuarioId);
    return { ...user, unlocked_frames: unlockedFrames };
}

// Search user level by ID
export const findLevelUser = async (usuarioId) => {
    const result = await db.query(`
        SELECT nivel
        FROM personia2.usuarios
        WHERE id = $1
    `, [usuarioId]);
    return result.rows[0] || null;
}

// Seacrh user xp by ID
export const findXpUser = async (usuarioId) => {
    const result = await db.query(`
        SELECT xp
        FROM personia2.usuarios
        WHERE id = $1
    `, [usuarioId]);
    return result.rows[0] || null;

}

// Add XP to user and level up if needed
export const updateXpAndLevel = async (usuarioId, xpGanho) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const userResult = await client.query(`
      SELECT id, nivel, xp, frame FROM personia2.usuarios WHERE id = $1 FOR UPDATE
    `, [usuarioId]);

    if (!userResult.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    let { nivel, xp, frame } = userResult.rows[0];

    function xpParaNivel(n) {
      return Math.min(200 + (n - 1) * 100, 1000);
    }

    let totalXp = Number(xp) || 0;
    totalXp += Number(xpGanho) || 0;
    let novoNivel = Number(nivel) || 1;
    let novoXp = totalXp;

    while (novoXp >= xpParaNivel(novoNivel)) {
      novoXp -= xpParaNivel(novoNivel);
      novoNivel += 1;
    }

    await client.query(`
      UPDATE personia2.usuarios
      SET nivel = $2, xp = $3
      WHERE id = $1
    `, [usuarioId, novoNivel, novoXp]);

    const unlockedFrames = await syncUnlockedFramesInConnection(client, usuarioId, novoNivel);

    await client.query('COMMIT');

    return {
      nivel: novoNivel,
      xp_atual: novoXp,
      unlocked_frames: unlockedFrames,
      frame,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Variant of updateXpAndLevel that uses an existing DB client/transaction.
// This allows calling code to perform atomic operations spanning multiple tables.
export const updateXpAndLevelWithClient = async (client, usuarioId, xpGanho) => {
    // Assumes caller has started a transaction on the provided client.
    const userResult = await client.query(`
        SELECT id, nivel, xp, frame FROM personia2.usuarios WHERE id = $1 FOR UPDATE
    `, [usuarioId]);

    if (!userResult.rows[0]) {
        return null;
    }

    let { nivel, xp, frame } = userResult.rows[0];

    function xpParaNivel(n) {
        return Math.min(200 + (n - 1) * 100, 1000);
    }

    let totalXp = Number(xp) || 0;
    totalXp += Number(xpGanho) || 0;
    let novoNivel = Number(nivel) || 1;
    let novoXp = totalXp;

    while (novoXp >= xpParaNivel(novoNivel)) {
        novoXp -= xpParaNivel(novoNivel);
        novoNivel += 1;
    }

    await client.query(`
        UPDATE personia2.usuarios
        SET nivel = $2, xp = $3
        WHERE id = $1
    `, [usuarioId, novoNivel, novoXp]);

    const unlockedFrames = await syncUnlockedFramesInConnection(client, usuarioId, novoNivel);

    return {
        nivel: novoNivel,
        xp_atual: novoXp,
        unlocked_frames: unlockedFrames,
        frame,
    };
};