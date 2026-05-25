import * as userService from "../services/userService.js";

export const getUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await userService.getUsuario(id);
    return res.status(200).json(user);

  } catch (err) {
    console.error("Erro ao buscar usuário:", err);

    return res.status(err.statusCode || 500).json({
      error: err.message || "Erro interno do servidor ao buscar perfil."
    });
  }
};

// buscar os dados da própria conta do usuário
export const getUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await userService.getUserById(id);

    return res.status(200).json(user);

  } catch (err) {

    console.error("Erro ao buscar usuário:", err);

    if (err.message === 'USUARIO_NÃO_ENCONTRADO') {
      return res.status(404).json({
        error: "Usuário não encontrado"
      })
    }
    
    return res.status(500).json({
      error: "Erro interno do servidor ao buscar perfil."
    });
  }
}

// rota para mostra o nome do usuário
export const getNameUser = async (req, res) => {
  const { id } = req.params;

  try {
    const usuarioId = parseInt(id, 10);
    if (isNaN(usuarioId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const nameUser = await userService.getNameUserService(usuarioId);

    return res.status(200).json({ nome: nameUser });

  } catch (err) {
    console.error('Erro ao buscar nome do usuário:', err);

    return res.status(500).json({ error: 'Erro ao buscar nome do usuário.' });
  }
}


// mostra os dados de outro usuario
export const getOtherUser = async (req, res) => {
  const { id } = req.params;

  try {
    const otherUser = await userService.getOtherUserService(id);

    return res.status(200).json(otherUser);

  } catch (err) {
    console.error('Erro ao carregar dados do usuário', err);

    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

// rota para editar o perfil do usuário
export const editProfile = async (req, res) => {

  try {
    const { id } = req.params;

    const updateProfile = await userService.editProfileService(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Perfil atualizado com sucesso!",
      usuario_atualizado: updateProfile
    });

  } catch (err) {
    console.error("Erro ao editar perfil:", err);

    if (err.message === 'NOME_OBRIGATORIO') {
      return res.status(400).json({ error: "O nome é obrigatório e não pode ficar vazio." });
    }

    if (err.message === 'USUARIO_NAO_ENCONTRADO') {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    return res.status(500).json({ error: "Erro interno ao atualizar perfil." });
  }
}

// rota para mostrar o nome de outro usuário
export const getNameOtherUser = async (req, res) => {
  const { usuarioId } = req.params;

  if (!usuarioId || isNaN(usuarioId)) {
    return res.status(400).json({ error: 'ID do usuário inválido.' });
  }

  try {
    const nameOtherUser = await userService.getNameOtherUserService(usuarioId);
    return res.status(200).json(nameOtherUser);
  } catch (err) {
    console.error('Erro ao buscar nome do usuário:', err);
    if (err.message === 'ID_INVALIDO') {
      return res.status(400).json({ error: 'ID do usuário inválido.' });
    }
    if (err.message === 'USUARIO_NAO_ENCONTRADO') {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    return res.status(500).json({ error: 'Erro ao buscar nome do usuário.' });
  }
}
