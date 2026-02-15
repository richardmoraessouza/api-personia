import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_padrao_muito_seguro';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers['x-access-token'] || req.headers['token'];

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido', code: 'NO_TOKEN' });
    }

    let token = authHeader;
    if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token || token === 'undefined' || token === 'null') {
        return res.status(401).json({ error: 'Token inválido ou não logado', code: 'INVALID_TOKEN' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        req.user = decoded;
        
        return next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Sua sessão expirou.', code: 'SESSION_EXPIRED' });
        }
        
        return res.status(401).json({ 
            error: 'Token inválido', 
            code: 'INVALID_TOKEN' 
        });
    }
};