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

  const currentImage = images[selectedImageIndex] || images[0] || '';

  const openGallery = (index) => {
    setSelectedImageIndex(index);
    setIsGalleryModalOpen(true);
  };

  const goToNextImage = () => {
    if (!images.length) return;
    setSelectedImageIndex((current) => (current + 1) % images.length);
  };

  const goToPreviousImage = () => {
    if (!images.length) return;
    setSelectedImageIndex((current) => (current - 1 + images.length) % images.length);
  };

  const handleMessageOwner = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!apartment?.owner?._id) {
      alert('Owner information is not available.');
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
      alert('Could not start a conversation with the owner.');
    }
  };

  const handleBooking = async (event) => {
    if (event) event.preventDefault();

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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
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

        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            {apartment.title || apartment.name}
          </h1>

          {/* Verification Status Card */}
          <div className="mt-4">
            {isVerified ? (
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-emerald-700">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <i className="fas fa-check-circle text-lg"></i>
                </div>
                <div>
                  <p className="font-bold">Verified Listing</p>
                  <p className="text-sm opacity-90">This apartment is verified by Sokon administrator</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-100 p-4 text-amber-700">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <i className="fas fa-exclamation-circle text-lg"></i>
                </div>
                <div>
                  <p className="font-bold">Not Verified Yet</p>
                  <p className="text-sm opacity-90">This apartment is not verified yet by Sokon administrator</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          {/* Main Media Section (Video First) */}
          <div className="relative">
            <div className="w-full bg-slate-900 overflow-hidden">
              {mediaUrl ? (
                <div className="aspect-video w-full">
                  <video
                    controls
                    autoPlay
                    muted
                    className="h-full w-full object-cover"
                    src={mediaUrl}
                  />
                </div>
              ) : images.length > 0 ? (
                <div className="h-[420px] w-full">
                  <img
                    src={images[0]}
                    alt={apartment.title || apartment.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
            </div>

            <div className="absolute right-4 top-4 flex flex-wrap gap-3">
              {((apartment.latitude ?? apartment.lat) && (apartment.longitude ?? apartment.lng)) && (
                <button
                  type="button"
                  onClick={openGoogleMaps}
                  className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur transition hover:bg-white"
                  title="Open in Google Maps"
                >
                  <i className="fas fa-map-location-dot mr-2 text-primary"></i>
                  Map
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-8 p-6 md:p-8">
            {/* Header info after video */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6">
               <div>
                  <p className="flex items-center gap-2 text-sm text-slate-500">
                    <i className="fas fa-location-dot text-primary"></i>
                    {locationLabel || 'Location not set'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-slate-700">
                    {apartment.bedrooms ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        <i className="fas fa-bed mr-2 text-primary"></i>
                        {apartment.bedrooms} Beds
                      </span>
                    ) : null}
                    {apartment.bathrooms ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        <i className="fas fa-bath mr-2 text-primary"></i>
                        {apartment.bathrooms} Bathrooms
                      </span>
                    ) : null}
                    {apartment.rooms ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        <i className="fas fa-door-open mr-2 text-primary"></i>
                        {apartment.rooms} Rooms
                      </span>
                    ) : null}
                  </div>
               </div>
               <div className="rounded-2xl bg-primary/5 px-6 py-4">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Monthly Rent
                  </span>
                  <div className="mt-1 text-3xl font-black text-primary">
                    ${apartment.price}
                  </div>
               </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Description</h2>
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
                    className={`h-full rounded-full ${isFull ? 'bg-rose-500' : 'bg-primary'}`}
                    style={{ width: `${occupancyProgress}%` }}
                  />
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  {isFull
                    ? 'This apartment is currently full.'
                    : `${availableSpots} spot${availableSpots === 1 ? '' : 's'} remain available.`}
                </p>
              </div>
            </div>

            {/* Detailed Info Tiles */}
            <div className="rounded-[28px] bg-slate-50 p-5">
              <h3 className="text-xl font-black text-slate-900 mb-5">Property Information</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoTile label="Floor" value={apartment.floor || 'N/A'} />
                <InfoTile label="Capacity" value={apartment.max_people || 0} />
                <InfoTile label="Available" value={apartment.available_people || 0} />
                <InfoTile label="City" value={apartment.city || 'Not set'} />
                <InfoTile label="District" value={apartment.district || 'Not set'} />
                <InfoTile label="Address" value={apartment.address || 'Not set'} />
              </div>
            </div>

            {/* Gallery Section */}
            {images.length > 0 && (
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-4">Image Gallery</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => openGallery(index)}
                      className="group relative aspect-[4/3] overflow-hidden rounded-2xl"
                    >
                      <img
                        src={image}
                        alt={`Gallery ${index + 1}`}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                    </div>
                  </div>

                  {user?._id !== apartment.owner?._id && (
                    <button
                      type="button"
                      onClick={handleMessageOwner}
                      className="rounded-full bg-white px-5 py-3 font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
                    >
                      <i className="far fa-comment-dots mr-2 text-primary"></i>
                      Contact owner
                    </button>
                  )}
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
                  className="flex-1 rounded-2xl bg-primary py-4 text-center text-lg font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {hasRented ? 'Already rented' : isFull ? 'Full' : 'Rent now'}
                </button>
              )}

              {!user && (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="flex-1 rounded-2xl bg-primary py-4 text-center text-lg font-black text-white transition hover:opacity-90"
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

          <div className="mb-8 flex flex-col gap-6 rounded-2xl bg-slate-50 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <span className="block text-4xl font-black text-primary">
                  {apartment.rating_average !== undefined ? Number(apartment.rating_average).toFixed(1) : '0.0'}
                </span>
                <span className="text-xs text-slate-400">out of 5</span>
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
                  {apartment.rating_count || 0} reviews
                </p>
              </div>
            </div>
          </div>

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
                      <p className="mt-2 text-sm text-slate-600">
                        {review.comment || 'No comment.'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 py-6">No reviews yet.</p>
            )}
          </div>

          {isEligible && (
            <div className="mt-10 border-t border-slate-100 pt-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Rate this apartment</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewReview((prev) => ({ ...prev, rating: i + 1 }))}
                      className="text-amber-400 text-2xl transition hover:scale-110"
                    >
                      <i className={`${i < newReview.rating ? 'fa-solid' : 'fa-regular'} fa-star`}></i>
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
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
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
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
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
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
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full rounded-2xl bg-primary py-4 font-black text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {bookingLoading ? 'Sending...' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isGalleryModalOpen && images.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 px-4 py-6 backdrop-blur-sm">
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
                className="max-h-[85vh] w-full object-contain"
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goToPreviousImage}
                    className="absolute left-4 rounded-full bg-white/20 p-4 text-white hover:bg-white/40"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button
                    type="button"
                    onClick={goToNextImage}
                    className="absolute right-4 rounded-full bg-white/20 p-4 text-white hover:bg-white/40"
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
  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm border border-slate-100">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-900 break-words">{value}</p>
  </div>
);
