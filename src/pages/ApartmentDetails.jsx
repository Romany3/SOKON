import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { apartmentsAPI, bookingsAPI, chatAPI, reviewsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useStoreVersion } from '../hooks/useStoreVersion';
import { AVATAR_SM_PLACEHOLDER } from '../utils/placeholders';

export const ApartmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const storeVersion = useStoreVersion();
  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [bookingForm, setBookingForm] = useState({
    checkInDate: '',
    checkOutDate: '',
    requestedOccupants: 1,
    message: '',
  });
  const [reviews, setReviews] = useState([]);
  const [isEligible, setIsEligible] = useState(false);
  const [hasRented, setHasRented] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5 });
  const [submittingReview, setSubmittingReview] = useState(false);

  const isVerified = Boolean(apartment?.verified);
  const locationLabel =
    apartment?.city && apartment?.district
      ? `${apartment.district}, ${apartment.city}`
      : apartment?.locationAddress || apartment?.address || apartment?.location || '';
  const mediaUrl = apartment?.videoUrl || apartment?.video_url || '';

  const loadReviews = async () => {
    try {
      const res = await reviewsAPI.getApartmentReviews(id);
      setReviews(res.data?.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const checkEligibility = async () => {
    if (!user) {
      setIsEligible(false);
      setHasRented(false);
      return;
    }
    try {
      const res = await bookingsAPI.getMyBookings();
      const bookings = res.data?.bookings || [];
      
      const bookingsForThisApartment = bookings.filter(
        (b) => {
          const aptId = b.apartmentId || b.apartment?._id || b.apartment;
          return aptId && `${aptId}` === `${id}`;
        }
      );

      const hasApprovedBooking = bookingsForThisApartment.some(
        (b) => ['approved', 'accepted', 'confirmed', 'completed'].includes(b.status)
      );

      const hasAnyActiveBooking = bookingsForThisApartment.some(
        (b) => ['pending', 'approved', 'accepted', 'confirmed', 'completed'].includes(b.status)
      );

      setIsEligible(hasApprovedBooking);
      setHasRented(hasAnyActiveBooking);
    } catch (err) {
      console.error('Error checking eligibility:', err);
    }
  };

  useEffect(() => {
    const loadApartment = async () => {
      setLoading(true);

      try {
        const response = await apartmentsAPI.getApartment(id);
        setApartment(response.data);
      } catch (error) {
        console.error('Error fetching apartment:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadApartment();
      loadReviews();
      checkEligibility();
    }
  }, [id, storeVersion]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await reviewsAPI.createReview({
        apartmentId: id,
        rating: newReview.rating,
        comment: '',
      });
      setNewReview({ rating: 5 });
      await loadReviews();
      const response = await apartmentsAPI.getApartment(id);
      setApartment(response.data);
    } catch (err) {
      alert(err?.message || err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const images = apartment?.images || [];
  const capacity = Number(apartment?.capacity ?? apartment?.max_people ?? apartment?.beds ?? 0);
  const occupiedCount = Number(apartment?.occupiedCount || 0);
  const availableSpots = Math.max(capacity - occupiedCount, 0);
  const occupancyProgress = capacity > 0 ? Math.min((occupiedCount / capacity) * 100, 100) : 0;
  const isFull = capacity > 0 && availableSpots <= 0;
  const mainMedia = mediaUrl ? 'video' : 'image';

  const currentImage = images[selectedImageIndex] || images[0] || '';

  const openGallery = (index) => {
    setSelectedImageIndex(index);
    setIsGalleryModalOpen(true);
  };

  const goToNextImage = () => {
    if (!images.length) {
      return;
    }

    setSelectedImageIndex((current) => (current + 1) % images.length);
  };

  const goToPreviousImage = () => {
    if (!images.length) {
      return;
    }

    setSelectedImageIndex((current) => (current - 1 + images.length) % images.length);
  };

  const handleMessageOwner = async () => {
    if (!user || !apartment?.owner?._id) {
      navigate('/login');
      return;
    }

    try {
      const response = await chatAPI.getOrCreateConversation({
        participantIds: [user._id, apartment.owner._id],
        apartmentId: apartment._id,
        participants: [
          {
            _id: user._id,
            fullName: user.fullName || user.name || '',
            photoUrl: user.photoUrl || user.avatar || '',
          },
          {
            _id: apartment.owner._id,
            fullName: apartment.owner.fullName || apartment.owner.name || apartment.ownerName || '',
            photoUrl: apartment.owner.photoUrl || apartment.owner.avatar || apartment.ownerPhotoUrl || '',
          },
        ],
      });
      const conversation = response.data?.conversation || response.data;

      if (conversation?._id) {
        navigate(`/messages/${conversation._id}`);
        return;
      }

      navigate('/messages');
    } catch (error) {
      console.error('Error opening conversation:', error);
    }
  };

  const handleBooking = async (event) => {
    if (event) {
      event.preventDefault();
    }

    if (!['student', 'client'].includes(user?.role)) {
      alert('Only students can book apartments');
      return;
    }

    if (!bookingForm.checkInDate || !bookingForm.checkOutDate) {
      alert('Please select both check-in and check-out dates.');
      return;
    }

    setBookingLoading(true);

    try {
      await bookingsAPI.createBooking({
        apartmentId: id,
        checkInDate: bookingForm.checkInDate,
        checkOutDate: bookingForm.checkOutDate,
        requestedOccupants: Number(bookingForm.requestedOccupants || 1),
        message: bookingForm.message || 'I would like to book this apartment.',
      });

      setBookingSuccess('Booking request sent successfully!');
      setIsBookingModalOpen(false);
      setTimeout(() => {
        navigate('/my-bookings');
      }, 1800);
    } catch (error) {
      alert(error?.message || error.response?.data?.message || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const openGoogleMaps = () => {
    const latitude = apartment?.latitude ?? apartment?.lat;
    const longitude = apartment?.longitude ?? apartment?.lng;

    if (latitude && longitude) {
      window.open(
        `https://www.google.com/maps?q=${latitude},${longitude}`,
        '_blank',
        'noopener,noreferrer',
      );
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-light">
        <Navbar />
        <div className="py-20 text-center">
          <p className="text-gray-600">Loading apartment details...</p>
        </div>
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="w-full min-h-screen bg-light">
        <Navbar />
        <div className="py-20 text-center">
          <p className="text-gray-600">Apartment not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#f6f7fb]">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8">
        {bookingSuccess && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            {bookingSuccess}
          </div>
        )}

        <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="relative">
            <div className="h-[420px] w-full bg-slate-900">
              {mainMedia === 'video' ? (
                <video
                  controls
                  className="h-full w-full object-cover"
                  src={mediaUrl}
                  poster={images[0]}
                />
              ) : (
                <img
                  src={images[0]}
                  alt={apartment.title || apartment.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent px-6 py-6 text-white md:px-8 md:py-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                      {apartment.title || apartment.name}
                    </h1>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur ${
                        isVerified ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'
                      }`}
                    >
                      <i className={`fas ${isVerified ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                      {isVerified ? 'Verified' : 'Not verified'}
                    </span>
                    {apartment.rating_average !== undefined && apartment.rating_count > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-sm font-bold text-amber-400 backdrop-blur">
                        ⭐ {Number(apartment.rating_average).toFixed(1)} / 5
                        <span className="text-xs text-white/60 font-normal">({apartment.rating_count})</span>
                      </span>
                    )}
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-sm text-white/80">
                    <i className="fas fa-location-dot text-blue-300"></i>
                    {locationLabel || 'Location not set'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                    {apartment.bedrooms ? (
                      <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                        <i className="fas fa-bed mr-2 text-blue-300"></i>
                        {apartment.bedrooms} Bedrooms
                      </span>
                    ) : null}
                    {apartment.bathrooms ? (
                      <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                        <i className="fas fa-bath mr-2 text-blue-300"></i>
                        {apartment.bathrooms} Bathrooms
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[28px] bg-white/10 px-5 py-4 backdrop-blur">
                  <span className="block text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                    Price
                  </span>
                  <div className="mt-2 text-3xl font-black">
                    ${apartment.price}
                    <span className="ml-2 text-sm font-semibold text-white/70">/month</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute right-4 top-4 flex flex-wrap gap-3">
              {((apartment.latitude ?? apartment.lat) && (apartment.longitude ?? apartment.lng)) && (
                <button
                  type="button"
                  onClick={openGoogleMaps}
                  className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur transition hover:bg-white"
                  title="Open in Google Maps"
                >
                  <i className="fas fa-map-location-dot mr-2 text-[#245999]"></i>
                  Map
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-8 p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-slate-900">Description</h2>
                    {apartment.rating_average !== undefined && apartment.rating_count > 0 && (
                      <span className="text-sm font-bold text-amber-500">
                        ⭐ {Number(apartment.rating_average).toFixed(1)} ({apartment.rating_count} reviews)
                      </span>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isVerified ? 'Verified' : 'Not verified'}
                  </span>
                </div>
                <p className="mt-4 leading-7 text-slate-600">
                  {apartment.description_en || apartment.description_ar || apartment.description}
                </p>
              </div>

              <div className="rounded-[28px] bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Occupancy
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900">
                      {capacity > 0 ? `${occupiedCount} / ${capacity} occupied` : 'Capacity not set'}
                    </h3>
                  </div>
                  <div className={`rounded-2xl px-4 py-3 text-right ${isFull ? 'bg-rose-100 text-rose-700' : 'bg-white text-slate-900'}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Available</p>
                    <p className="mt-1 text-2xl font-black">{availableSpots}</p>
                  </div>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${isFull ? 'bg-rose-500' : 'bg-[#245999]'}`}
                    style={{ width: `${occupancyProgress}%` }}
                  />
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  {isFull
                    ? 'This apartment is currently full.'
                    : `${availableSpots} spot${availableSpots === 1 ? '' : 's'} remain before the apartment is hidden from homepage listings.`}
                </p>
              </div>
            </div>

            <div className="rounded-[28px] bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">All details</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">Property information</h3>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
                  <p className={`mt-1 font-black ${isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {isVerified ? 'Verified listing' : 'Pending verification'}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <InfoTile label="Price" value={`$${apartment.price || 0}/month`} />
                <InfoTile label="Bedrooms" value={apartment.bedrooms || 0} />
                <InfoTile label="Bathrooms" value={apartment.bathrooms || 0} />
                <InfoTile label="Living Rooms" value={apartment.living_rooms || 0} />
                <InfoTile label="Floor" value={apartment.floor || 0} />
                <InfoTile label="Max People" value={apartment.max_people || 0} />
                <InfoTile label="Available People" value={apartment.available_people || 0} />
                <InfoTile label="Occupied" value={`${occupiedCount} / ${capacity || apartment.max_people || 0}`} />
                <InfoTile label="Address" value={apartment.address || 'Not set'} />
                <InfoTile label="City" value={apartment.city || 'Not set'} />
                <InfoTile label="District" value={apartment.district || 'Not set'} />
                <InfoTile label="Location" value={apartment.locationAddress || apartment.location || 'Not set'} />
              </div>
            </div>

            {apartment.owner && (
              <div className="rounded-[28px] bg-slate-50 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={apartment.owner.avatar || AVATAR_SM_PLACEHOLDER}
                      alt={apartment.owner.fullName}
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{apartment.owner.fullName}</h3>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Owner</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {apartment.owner.phoneNumber || apartment.owner.email || 'No contact info'}
                      </p>
                    </div>
                  </div>

                  {isEligible ? (
                    <button
                      type="button"
                      onClick={handleMessageOwner}
                      className="rounded-full bg-white px-5 py-3 font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
                    >
                      <i className="far fa-comment-dots mr-2 text-[#245999]"></i>
                      Message owner
                    </button>
                  ) : (
                    <div className="rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-500">
                      Message owner becomes available after booking approval
                    </div>
                  )}
                </div>
              </div>
            )}

            {images.length > 0 && (
              <div>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Gallery</h2>
                    <p className="text-sm text-slate-500">Click any image to open the full viewer</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {images.slice(0, 4).map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => openGallery(index)}
                      className="group relative aspect-[4/3] overflow-hidden rounded-2xl"
                    >
                      <img
                        src={image}
                        alt={`Gallery ${index + 1}`}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      {index === 3 && images.length > 4 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 text-2xl font-black text-white">
                          +{images.length - 4}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row">
              {user?.role === 'student' && (
                <button
                  type="button"
                  onClick={() => {
                    if (hasRented) {
                      alert('You have already rented/booked this apartment!');
                      return;
                    }
                    if (isFull) return;
                    setIsBookingModalOpen(true);
                  }}
                  disabled={isFull || hasRented}
                  className="flex-1 rounded-2xl bg-[#245999] py-4 text-center text-lg font-black text-white transition hover:bg-[#1f4f86] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {hasRented ? 'You already rented this' : isFull ? 'Apartment is full' : 'Rent now'}
                </button>
              )}

              {!user && (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="flex-1 rounded-2xl bg-[#245999] py-4 text-center text-lg font-black text-white transition hover:bg-[#1f4f86]"
                >
                  Login to rent
                </button>
              )}

              {user?.role === 'owner' && user?._id === apartment.owner?._id && (
                <button
                  type="button"
                  onClick={() => navigate(`/edit-apartment/${id}`)}
                  className="flex-1 rounded-2xl bg-slate-900 py-4 text-center text-lg font-black text-white transition hover:bg-slate-800"
                >
                  Edit apartment
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 overflow-hidden rounded-[32px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-8">
          <h2 className="text-2xl font-black text-slate-900 mb-6">Reviews & Ratings</h2>

          {/* Average rating summary card */}
          <div className="mb-8 flex flex-col gap-6 rounded-2xl bg-slate-50 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <span className="block text-4xl font-black text-[#245999]">
                  {apartment.rating_average !== undefined ? Number(apartment.rating_average).toFixed(1) : '0.0'}
                </span>
                <span className="text-xs text-slate-400">out of 5 stars</span>
              </div>
              <div className="h-12 w-[1px] bg-slate-200"></div>
              <div>
                <div className="flex items-center text-amber-400 text-lg">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <i
                      key={i}
                      className={`${
                        i < Math.round(apartment.rating_average || 0) ? 'fa-solid' : 'fa-regular'
                      } fa-star mr-1`}
                    ></i>
                  ))}
                </div>
                <p className="mt-1 text-sm text-slate-500 font-semibold">
                  {apartment.rating_count || 0} reviews total
                </p>
              </div>
            </div>
          </div>

          {/* Reviews list */}
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review._id || review.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    <img
                      src={review.userAvatar || AVATAR_SM_PLACEHOLDER}
                      alt={review.userName}
                      className="h-12 w-12 rounded-full object-cover shadow-sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <h4 className="font-bold text-slate-900">{review.userName}</h4>
                        <span className="text-xs text-slate-400">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-amber-400 text-xs">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <i key={i} className={`${i < review.rating ? 'fa-solid' : 'fa-regular'} fa-star mr-1`}></i>
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                        {review.comment || 'No comment provided.'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 py-6">No reviews yet for this apartment.</p>
            )}
          </div>

          {/* Submission Form */}
          {isEligible && (
            <div className="mt-10 border-t border-slate-100 pt-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Rate this apartment</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Stars
                  </label>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewReview((prev) => ({ ...prev, rating: i + 1 }))}
                        className="text-amber-400 text-2xl transition hover:scale-110 active:scale-95"
                      >
                        <i className={`${i < newReview.rating ? 'fa-solid' : 'fa-regular'} fa-star`}></i>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="rounded-xl bg-[#245999] px-6 py-3 font-semibold text-white transition hover:bg-[#1f4f86] disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl md:p-8">
            <button
              type="button"
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-3 text-slate-500 transition hover:bg-slate-200"
            >
              <i className="fas fa-times"></i>
            </button>

            <h3 className="text-2xl font-black text-slate-900">Book apartment</h3>
            <p className="mt-2 text-sm text-slate-500">
              Request the number of occupants you need for this apartment.
            </p>

            <form onSubmit={handleBooking} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Check-in date
                  </label>
                  <input
                    type="date"
                    value={bookingForm.checkInDate}
                    onChange={(event) => setBookingForm((current) => ({ ...current, checkInDate: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#245999]/20"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Check-out date
                  </label>
                  <input
                    type="date"
                    value={bookingForm.checkOutDate}
                    onChange={(event) => setBookingForm((current) => ({ ...current, checkOutDate: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#245999]/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Requested occupants
                </label>
                <input
                  type="number"
                  min="1"
                  max={capacity > 0 ? availableSpots || capacity : undefined}
                  value={bookingForm.requestedOccupants}
                  onChange={(event) => setBookingForm((current) => ({ ...current, requestedOccupants: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#245999]/20"
                  required
                />
                <p className="mt-2 text-xs text-slate-400">
                  {capacity > 0 ? `Available spots: ${availableSpots}` : 'Capacity not set yet.'}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Message to owner
                </label>
                <textarea
                  placeholder="Hi, I would like to book this apartment..."
                  value={bookingForm.message}
                  onChange={(event) => setBookingForm((current) => ({ ...current, message: event.target.value }))}
                  className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#245999]/20"
                  rows="4"
                />
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full rounded-2xl bg-[#245999] py-4 font-black text-white transition hover:bg-[#1f4f86] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {bookingLoading ? 'Sending booking request...' : 'Confirm rent request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isGalleryModalOpen && images.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setIsGalleryModalOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-slate-900/90 p-3 text-white"
            >
              <i className="fas fa-times"></i>
            </button>

            <div className="relative flex min-h-[60vh] items-center justify-center bg-slate-950">
              <img
                src={currentImage}
                alt={`Gallery ${selectedImageIndex + 1}`}
                className="max-h-[75vh] w-full object-contain"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goToPreviousImage}
                    className="absolute left-4 rounded-full bg-white/90 p-4 text-slate-900 shadow-lg transition hover:bg-white"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button
                    type="button"
                    onClick={goToNextImage}
                    className="absolute right-4 rounded-full bg-white/90 p-4 text-slate-900 shadow-lg transition hover:bg-white"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoTile = ({ label, value }) => (
  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-900 break-words">{value}</p>
  </div>
);
