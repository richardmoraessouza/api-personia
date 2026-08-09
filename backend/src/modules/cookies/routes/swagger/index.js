/**
 * @openapi
 * tags:
 *   - name: Cookies
 *     description: Gerenciamento de consentimento e políticas de cookies do sistema.
 */

/**
 * @swagger
 * /api/cookies/consent:
 *   get:
 *     summary: Retrieve the current cookie consent status
 *     tags:
 *       - Cookies
 *     responses:
 *       200:
 *         description: Cookie consent status returned successfully
 *       500:
 *         description: Error retrieving consent status
 */

/**
 * @swagger
 * /api/cookies/consent:
 *   post:
 *     summary: Save cookie consent preferences in the session
 *     tags:
 *       - Cookies
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             analytics: true
 *             marketing: false
 *             preferences: true
 *     responses:
 *       200:
 *         description: Consent saved successfully
 *       400:
 *         description: Invalid consent data
 *       500:
 *         description: Error saving consent
 */

/**
 * @swagger
 * /api/cookies/consent:
 *   delete:
 *     summary: Clear the current cookie consent state
 *     tags:
 *       - Cookies
 *     responses:
 *       200:
 *         description: Consent cleared successfully
 *       500:
 *         description: Error clearing consent
 */

/**
 * @swagger
 * /api/cookies/accept-all:
 *   post:
 *     summary: Accept all cookies
 *     tags:
 *       - Cookies
 *     responses:
 *       200:
 *         description: Consent state updated successfully
 *       500:
 *         description: Error updating consent
 */

/**
 * @swagger
 * /api/cookies/reject-all:
 *   post:
 *     summary: Reject non-essential cookies
 *     tags:
 *       - Cookies
 *     responses:
 *       200:
 *         description: Consent state updated successfully
 *       500:
 *         description: Error updating consent
 */
