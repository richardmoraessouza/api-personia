/**
 * Módulo Chat IA
 * Exporta todos os serviços, controllers e rotas
 */

export { default as chatRouter } from './routes/chatRouter.js';
export * as chatController from './controllers/chatController.js';
export * as chatService from './services/chatService.js';
export * as chatRepository from './repositories/chatRepository.js';
export { default as buildPersonPrompt } from './utils/buildPersonPrompt.js';
export * from './utils/geminiClient.js';
