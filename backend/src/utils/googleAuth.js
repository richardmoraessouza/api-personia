import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const ALLOWED_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

export const verifyGoogleCredential = async (credential) => {
  if (!credential || typeof credential !== 'string' || credential.trim() === '') {
    const error = new Error('Credential do Google é obrigatório');
    error.statusCode = 401;
    throw error;
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      const error = new Error('Credential do Google inválido');
      error.statusCode = 401;
      throw error;
    }

    if (payload.aud !== GOOGLE_CLIENT_ID) {
      const error = new Error('Credential do Google inválido');
      error.statusCode = 401;
      throw error;
    }

    if (!payload.email || !payload.email_verified) {
      const error = new Error('Email do Google não verificado');
      error.statusCode = 401;
      throw error;
    }

    if (!payload.iss || !ALLOWED_ISSUERS.includes(payload.iss)) {
      const error = new Error('Credential do Google inválido');
      error.statusCode = 401;
      throw error;
    }

    return payload;
  } catch (err) {
    const error = new Error('Credential do Google inválido');
    error.statusCode = 401;
    throw error;
  }
};
