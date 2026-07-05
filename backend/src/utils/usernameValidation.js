const USERNAME_REGEX = /^[A-Za-z0-9._]+$/;

const createUsernameError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const validateUsername = (username, { required = true } = {}) => {
  if (username === undefined || username === null) {
    if (required) {
      throw createUsernameError('O username é obrigatório.');
    }
    return undefined;
  }

  const normalized = String(username);

  if (!normalized) {
    throw createUsernameError('O username é obrigatório.');
  }

  if (/\s/.test(normalized)) {
    throw createUsernameError('O username não pode conter espaços.');
  }

  if (normalized.length < 3 || normalized.length > 20) {
    throw createUsernameError('O username deve ter entre 3 e 20 caracteres.');
  }

  if (!USERNAME_REGEX.test(normalized)) {
    throw createUsernameError('O username pode conter apenas letras, números, ponto (.) e underscore (_).');
  }

  const lettersCount = (normalized.match(/[A-Za-z]/g) || []).length;
  if (lettersCount < 3) {
    throw createUsernameError('O username deve conter pelo menos 3 letras.');
  }

  if (/^[0-9]+$/.test(normalized)) {
    throw createUsernameError('O username não pode ser composto apenas por números.');
  }

  if (/^[._]+$/.test(normalized)) {
    throw createUsernameError('O username não pode ser composto apenas por pontos e/ou underscores.');
  }

  if (/^[0-9._]+$/.test(normalized)) {
    throw createUsernameError('O username não pode ser composto apenas por números, pontos e underscores.');
  }

  return normalized;
};
