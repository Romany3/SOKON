import { apiClient, emitStoreChange } from './apiClient';
import { mapUser } from './userService';

const asArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && Array.isArray(value.reviews)) {
    return value.reviews;
  }

  if (value && Array.isArray(value.data?.reviews)) {
    return value.data.reviews;
  }

  if (value && Array.isArray(value.data)) {
    return value.data;
  }

  return [];
};

export const mapReview = (review) => {
  if (!review) {
    return null;
  }

  const user = review.user
    ? mapUser(review.user)
    : review.reviewer
      ? mapUser(review.reviewer)
      : review.author
        ? mapUser(review.author)
        : null;

  return {
    ...review,
    _id: review.id || review._id || review.reviewId || '',
    id: review.id || review._id || review.reviewId || '',
    rating: Number(review.rating || review.score || 0),
    comment: review.comment || review.body || review.text || '',
    userName: user?.fullName || review.userName || review.reviewerName || review.authorName || '',
    userAvatar: user?.avatar || review.userAvatar || review.reviewerAvatar || review.authorAvatar || '',
    createdAt: review.createdAt || review.created_at || review.timestamp || '',
    user,
  };
};

const normalizeReviewList = (payload) => asArray(payload).map(mapReview).filter(Boolean);

export const reviewsAPI = {
  getApartmentReviews: async (apartmentId) => {
    const response = await apiClient.get(`/reviews/apartments/${apartmentId}`);
    return { data: { reviews: normalizeReviewList(response.data) } };
  },

  createReview: async (data) => {
    const response = await apiClient.post('/reviews', {
      apartmentId: data.apartmentId,
      rating: Number(data.rating || 0),
      comment: data.comment || '',
    });

    emitStoreChange();
    return { data: mapReview(response.data?.review || response.data?.data?.review || response.data) };
  },

  deleteReview: async (id) => {
    const response = await apiClient.delete(`/reviews/${id}`);
    emitStoreChange();
    return response;
  },
};
