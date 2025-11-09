import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_padrao_muito_seguro';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

    const token = authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token inválido' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET); // <- aqui usa a constante
        req.user = decoded; // adiciona os dados do usuário à requisição
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
};
