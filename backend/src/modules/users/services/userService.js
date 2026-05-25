import * as userRepository from "../repositories/userRepository.js";

export const getUsuario = async (req, res) => {
    const user = await userRepository.findById(id)

    if (!user) {
        const error = new Error('Usuário não encontrado');
        error.status = 404;
        throw error;
    }

    return user;
}

export const getUserById = async (id) => {
    const user = await userRepository.findUserById(id)

    if (!user) {
        throw new Error('Usuário não encontrado');
    }

    return user;
}

export const getNameUserService = async (usuarioId) => {
    const user = await userRepository.findUserById(usuarioId);
    if (!user) {
        throw new Error('ID_INVALIDO');
    }

    const nameUser = await userRepository.findNameUserById(usuarioId);

    if (!nameUser) {
        throw new Error('Usuário não encontrado');
    }

    return nameUser;
}

export const getOtherUserService = async (id) => {

    const OtherUser = await userRepository.findDateOtherUserByid(id);
    
    if (!OtherUser) {
        throw new Error('Usuário não encontrado');
    }


    return OtherUser;
}

// rota para editar o perfil do usuário
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

    return updateProfile;
}

export const getNameOtherUserService = async (usuarioId) => {
    if (!usuarioId || isNaN(usuarioId)) {
        throw new Error('ID_INVALIDO');
    }

    const nameOtherUser = await userRepository.findNameOtherUser(usuarioId);
    
    if (!nameOtherUser || !nameOtherUser.nome) {
        throw new Error('USUARIO_NAO_ENCONTRADO');
    }

    return nameOtherUser;
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