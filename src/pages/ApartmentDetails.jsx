import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { apartmentsAPI, bookingsAPI, chatAPI, reviewsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useStoreVersion } from '../hooks/useStoreVersion';
import { getApiErrorMessage } from '../services/apiClient';
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
  const [bookingError, setBookingError] = useState('');
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
    if (!user) return;
    try {
      const res = await bookingsAPI.getMyBookings();
      const bookings = res.data?.bookings || [];
      
      const bookingsForThisApartment = bookings.filter(
        (b) => {
          const aptId = b.apartmentId || b.apartment?._id || b.apartment?.id || b.apartment;
          return aptId && String(aptId) === String(id);
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
      alert(getApiErrorMessage(err, 'Failed to submit review'));
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
          { _id: user._id, fullName: user.fullName || user.name || '', photoUrl: user.photoUrl || user.avatar || '' },
          { _id: apartment.owner._id, fullName: apartment.owner.fullName || apartment.owner.name || '', photoUrl: apartment.owner.photoUrl || apartment.owner.avatar || '' },
        ],
      });
      const conversation = response.data?.conversation || response.data;
      if (conversation?._id) navigate(`/messages/${conversation._id}`);
      else navigate('/messages');
    } catch (error) {
      alert('Could not start a conversation with the owner.');
    }
  };

  const handleBooking = async (event) => {
    if (event) event.preventDefault();
    setBookingError('');

    if (!['student', 'client'].includes(user?.role)) {
      setBookingError('Only students can book apartments');
      return;
    }

    if (!bookingForm.checkInDate || !bookingForm.checkOutDate) {
      setBookingError('Please select both check-in and check-out dates.');
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
      setTimeout(() => navigate('/my-bookings'), 2000);
    } catch (error) {
      setBookingError(getApiErrorMessage(error, 'Failed to create booking'));
    } finally {
      setBookingLoading(false);
    }
  };

  const openGoogleMaps = () => {
    const latitude = apartment?.latitude ?? apartment?.lat;
    const longitude = apartment?.longitude ?? apartment?.lng;
    if (latitude && longitude) {
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
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
        <div className="py-20 text-center text-gray-600">Apartment not found</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#f6f7fb]">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8">
        {bookingSuccess && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <i className="fas fa-check-circle"></i>
            {bookingSuccess}
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            {apartment.title || apartment.name}
          </h1>

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
          <div className="relative">
            <div className="w-full bg-slate-900 overflow-hidden">
              {mediaUrl ? (
                <div className="aspect-video w-full">
                  <video controls className="h-full w-full object-cover" src={mediaUrl} />
                </div>
              ) : images.length > 0 ? (
                <div className="h-[420px] w-full">
                  <img src={images[0]} alt="" className="h-full w-full object-cover" />
                </div>
              ) : null}
            </div>

            <div className="absolute right-4 top-4">
              {((apartment.latitude ?? apartment.lat) && (apartment.longitude ?? apartment.lng)) && (
                <button
                  onClick={openGoogleMaps}
                  className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur transition hover:bg-white flex items-center gap-2"
                >
                  <i className="fas fa-map-location-dot text-primary"></i>
                  Map
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-8 p-6 md:p-8">
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
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Rent</span>
                  <div className="mt-1 text-3xl font-black text-primary">${apartment.price}</div>
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
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Occupancy</p>
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
                  <div className={`h-full rounded-full ${isFull ? 'bg-rose-500' : 'bg-primary'}`} style={{ width: `${occupancyProgress}%` }} />
                </div>
              </div>
            </div>

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

            {images.length > 0 && (
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-4">Image Gallery</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {images.map((image, index) => (
                    <button key={index} onClick={() => openGallery(index)} className="group relative aspect-[4/3] overflow-hidden rounded-2xl">
                      <img src={image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-110" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {apartment.owner && (
              <div className="rounded-[28px] bg-slate-50 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <img src={apartment.owner.avatar || AVATAR_SM_PLACEHOLDER} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{apartment.owner.fullName}</h3>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Owner</p>
                    </div>
                  </div>
                  {user?._id !== apartment.owner?._id && (
                    <button onClick={handleMessageOwner} className="rounded-full bg-white px-5 py-3 font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 flex items-center gap-2">
                      <i className="far fa-comment-dots text-primary"></i>
                      Contact owner
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row">
              {user?.role === 'student' || user?.role === 'client' ? (
                <button
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
                  {hasRented ? 'Already booked' : isFull ? 'Full' : 'Rent now'}
                </button>
              ) : !user ? (
                <button onClick={() => navigate('/login')} className="flex-1 rounded-2xl bg-primary py-4 text-center text-lg font-black text-white transition hover:opacity-90">
                  Login to rent
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl md:p-8">
            <button onClick={() => setIsBookingModalOpen(false)} className="absolute right-4 top-4 rounded-full bg-slate-100 p-3 text-slate-500 hover:bg-slate-200 transition">
              <i className="fas fa-times"></i>
            </button>
            <h3 className="text-2xl font-black text-slate-900">Book apartment</h3>
            
            {bookingError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2">
                 <i className="fas fa-circle-exclamation"></i>
                 {bookingError}
              </div>
            )}

            <form onSubmit={handleBooking} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-slate-400">Check-in</label>
                  <input type="date" value={bookingForm.checkInDate} onChange={(e) => setBookingForm({ ...bookingForm, checkInDate: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" required />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-slate-400">Check-out</label>
                  <input type="date" value={bookingForm.checkOutDate} onChange={(e) => setBookingForm({ ...bookingForm, checkOutDate: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" required />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-slate-400">Occupants</label>
                <input type="number" min="1" max={availableSpots || capacity} value={bookingForm.requestedOccupants} onChange={(e) => setBookingForm({ ...bookingForm, requestedOccupants: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" required />
              </div>
              <button type="submit" disabled={bookingLoading} className="w-full rounded-2xl bg-primary py-4 font-black text-white transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-3">
                {bookingLoading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating booking...
                  </>
                ) : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isGalleryModalOpen && images.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 px-4 py-6 backdrop-blur-sm" onClick={() => setIsGalleryModalOpen(false)}>
          <button className="absolute right-4 top-4 z-10 rounded-full bg-slate-900/90 p-3 text-white">
            <i className="fas fa-times"></i>
          </button>
          <div className="relative flex min-h-[60vh] items-center justify-center bg-slate-950 max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <img src={currentImage} alt="" className="max-h-[85vh] w-full object-contain" />
            {images.length > 1 && (
              <>
                <button onClick={goToPreviousImage} className="absolute left-4 rounded-full bg-white/20 p-4 text-white hover:bg-white/40"><i className="fas fa-chevron-left"></i></button>
                <button onClick={goToNextImage} className="absolute right-4 rounded-full bg-white/20 p-4 text-white hover:bg-white/40"><i className="fas fa-chevron-right"></i></button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const InfoTile = ({ label, value }) => (
  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm border border-slate-100">
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-bold text-slate-900 break-words">{value}</p>
  </div>
);
