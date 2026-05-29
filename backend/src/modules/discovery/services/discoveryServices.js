import * as discoveryRepository from '../repositories/discoveryRepository.js';

export const getPopularWeekService = async () => {
    return await discoveryRepository.findPopularWeek();
}