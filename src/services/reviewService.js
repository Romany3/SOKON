import { apiClient, emitStoreChange } from './apiClient';
import { mapUser } from './userService';

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.reviews)) return value.reviews;
  if (value && Array.isArray(value.data?.reviews)) return value.data.reviews;
  if (value && Array.isArray(value.data)) return value.data;
  return [];
};

export const mapReview = (review) => {
  if (!review) return null;
  const user = review.user ? mapUser(review.user) : (review.reviewer ? mapUser(review.reviewer) : null);

  return {
    ...review,
    _id: review.id || review._id || '',
    rating: Number(review.rating || 0),
    comment: review.comment || '',
    userName: user?.fullName || review.userName || 'Anonymous',
    userAvatar: user?.avatar || review.userAvatar || '',
    createdAt: review.createdAt || '',
    user,
  };
};

const normalizeReviewList = (payload) => asArray(payload).map(mapReview).filter(Boolean);

export const reviewsAPI = {
  getApartmentReviews: async (apartmentId) => {
    try {
      // Try the primary route
      const response = await apiClient.get(`/reviews/apartments/${apartmentId}`);
      return { data: { reviews: normalizeReviewList(response.data) } };
    } catch (error) {
      // Catch 404 (Not Found) silently - treat as "No reviews yet"
      if (error.response?.status === 404) {
        return { data: { reviews: [] } };
      }
      // Log other errors but don't crash
      console.warn("Reviews feature might not be fully configured on backend.");
      return { data: { reviews: [] } };
    }
  },

  createReview: async (data) => {
    try {
      const response = await apiClient.post('/reviews', {
        apartmentId: data.apartmentId,
        rating: Number(data.rating || 0),
        comment: data.comment || '',
      });
      emitStoreChange();
      return { data: mapReview(response.data?.review || response.data) };
    } catch (error) {
      console.error("Failed to create review:", error);
      throw error;
    }
  },

  deleteReview: async (id) => {
    const response = await apiClient.delete(`/reviews/${id}`);
    emitStoreChange();
    return response;
  },
};
