import * as userService from "../services/userService.js";

// Search user by ID
export const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await userService.getUserById(id);

    return res.status(200).json(user);

  } catch (err) {

    console.error("Error searching user:", err);

    if (err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        error: "User not found"
      })
    }
    
    return res.status(500).json({
      error: "Internal server error while searching profile."
    });
  }
}

// Get user name by ID
export const getNameUser = async (req, res) => {
  const { id } = req.params;

  try {
    const usuarioId = parseInt(id, 10);
    if (isNaN(usuarioId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const userData = await userService.getNameUserService(usuarioId);

    return res.status(200).json(userData);

  } catch (err) {
    console.error('Error searching user name:', err);

    return res.status(500).json({ error: 'Error searching user name.' });
  }
}


// Get another user's public profile data
export const getOtherUser = async (req, res) => {
  const { id } = req.params;

  try {
    const otherUser = await userService.getOtherUserService(id);

    return res.status(200).json(otherUser);

  } catch (err) {
    console.error('Error loading user data', err);

    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update user profile
export const editProfile = async (req, res) => {

  try {
    const { usuarioId } = req.params;

    const updateProfile = await userService.editProfileService(usuarioId, req.body);

    return res.status(200).json({
      success: true,
      message: "Perfil atualizado com sucesso!",
      usuario_atualizado: updateProfile
    });

  } catch (err) {
    console.error("Error editing profile:", err);

    if (err.message === 'NOME_OBRIGATORIO') {
      return res.status(400).json({ error: "Name is required and cannot be empty." });
    }

    if (err.message === 'USUARIO_NAO_ENCONTRADO') {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(500).json({ error: "Internal error while updating profile." });
  }
}

// Get another user's name by ID
export const getNameOtherUser = async (req, res) => {
  const { usuarioId } = req.params;

  if (!usuarioId || isNaN(usuarioId)) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }

  try {
    const nameOtherUser = await userService.getNameOtherUserService(usuarioId);
    return res.status(200).json(nameOtherUser);
  } catch (err) {
    console.error('Error searching user name:', err);
    if (err.message === 'ID_INVALIDO') {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }
    if (err.message === 'USUARIO_NAO_ENCONTRADO') {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.status(500).json({ error: 'Error searching user name.' });
  }
}

// Shows user data in mini profile
export const getDataMiniProfile = async (req, res) => {
  const { usuarioId } = req.params;
  
  if (!usuarioId || isNaN(usuarioId)) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }

  try {
    const dataMiniProfile = await userService.getDataMiniProfileService(usuarioId);
    return res.status(200).json(dataMiniProfile)
  } catch (err) {
    console.error('Error loading user data:', err.message);

    if (err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'USUARIO_NAO_ENCONTRADO' });
    }

    return res.status(500).json({ error: 'ERRO_INTERNO_SERVIDOR' });
  }
}

// update frame user
export const updateFrame = async (req, res) => {
  const { usuarioId } = req.params;
  const { frame } = req.body;

  if (!usuarioId || isNaN(usuarioId)) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }

  try {
    const updatedFrame = await userService.updateFrameService(usuarioId, frame);

    return res.status(200).json({ frame: updatedFrame });
  } catch (err) {
    console.error('Error updating frame:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
    
}