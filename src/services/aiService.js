import apiClient from './apiClient';

export const aiAPI = {
  /**
   * Send a message to the AI chatbot
   * @param {string} message - The user's message
   * @returns {Promise} - API response containing the AI's reply
   */
  chat: async (message) => {
    return await apiClient.post('/ai/chat', { message });
  },
};
