import * as discoveryService from '../services/discoveryServices.js';

export const getPopularWeek = async (req, res) => {
    try {
        const popularWeek = await discoveryService.getPopularWeekService();
        return res.status(200).json(popularWeek);
    } catch (err) {
        console.error('Error loading popular characters of the week', err);
        return res.status(500).json({ error: 'Error loading popular characters of the week.' });
    }
}