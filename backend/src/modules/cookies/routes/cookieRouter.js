/**
 * Rotas para gerenciar consentimento de cookies
 */

import express from 'express';

const router = express.Router();

/**
 * GET /api/cookies/consent
 * Retorna o status de consentimento da sessão atual
 * Nota: O consentimento real é gerenciado no cliente (localStorage)
 */
router.get('/consent', (req, res) => {
  try {
    // Verificar se há consentimento na sessão
    const sessionConsent = req.session?.cookieConsent || null;

    res.status(200).json({
      success: true,
      message: 'Consentimento de cookies recuperado',
      consent: sessionConsent || {
        analytics: false,
        marketing: false,
        preferences: false,
        essential: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erro ao obter consentimento de cookies:', error);
    res.status(500).json({
      success: false,
      erro: 'Erro ao obter consentimento de cookies',
    });
  }
});

/**
 * POST /api/cookies/consent
 * Salva o consentimento de cookies na sessão do servidor
 * (O cliente já salva no localStorage)
 */
router.post('/consent', express.json(), (req, res) => {
  try {
    const { analytics, marketing, preferences } = req.body;

    // Validar dados
    if (
      typeof analytics !== 'boolean' ||
      typeof marketing !== 'boolean' ||
      typeof preferences !== 'boolean'
    ) {
      return res.status(400).json({
        success: false,
        erro: 'Dados de consentimento inválidos',
      });
    }

    // Salvar na sessão
    req.session.cookieConsent = {
      analytics,
      marketing,
      preferences,
      essential: true,
      updatedAt: new Date().toISOString(),
    };

    console.log('✅ Consentimento de cookies salvo na sessão:', {
      userId: req.session.userId,
      consent: req.session.cookieConsent,
    });

    res.status(200).json({
      success: true,
      message: 'Consentimento de cookies salvo com sucesso',
      consent: req.session.cookieConsent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erro ao salvar consentimento de cookies:', error);
    res.status(500).json({
      success: false,
      erro: 'Erro ao salvar consentimento de cookies',
    });
  }
});

/**
 * DELETE /api/cookies/consent
 * Limpa o consentimento de cookies da sessão
 */
router.delete('/consent', (req, res) => {
  try {
    // Limpar consentimento da sessão
    delete req.session.cookieConsent;

    console.log('🗑️  Consentimento de cookies removido da sessão');

    res.status(200).json({
      success: true,
      message: 'Consentimento de cookies removido',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erro ao remover consentimento de cookies:', error);
    res.status(500).json({
      success: false,
      erro: 'Erro ao remover consentimento de cookies',
    });
  }
});

/**
 * POST /api/cookies/accept-all
 * Aceita todos os cookies de uma vez
 */
router.post('/accept-all', (req, res) => {
  try {
    req.session.cookieConsent = {
      analytics: true,
      marketing: true,
      preferences: true,
      essential: true,
      updatedAt: new Date().toISOString(),
    };

    console.log('✅ Todos os cookies aceitos:', {
      userId: req.session.userId,
    });

    res.status(200).json({
      success: true,
      message: 'Todos os cookies aceitos',
      consent: req.session.cookieConsent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erro ao aceitar todos os cookies:', error);
    res.status(500).json({
      success: false,
      erro: 'Erro ao aceitar todos os cookies',
    });
  }
});

/**
 * POST /api/cookies/reject-all
 * Rejeita todos os cookies não-essenciais
 */
router.post('/reject-all', (req, res) => {
  try {
    req.session.cookieConsent = {
      analytics: false,
      marketing: false,
      preferences: false,
      essential: true,
      updatedAt: new Date().toISOString(),
    };

    console.log('🚫 Todos os cookies não-essenciais rejeitados:', {
      userId: req.session.userId,
    });

    res.status(200).json({
      success: true,
      message: 'Todos os cookies não-essenciais rejeitados',
      consent: req.session.cookieConsent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erro ao rejeitar cookies:', error);
    res.status(500).json({
      success: false,
      erro: 'Erro ao rejeitar cookies',
    });
  }
});

export default router;
