import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { bookingsAPI } from '../services/api';
import { useStoreVersion } from '../hooks/useStoreVersion';
import { APARTMENT_PLACEHOLDER } from '../utils/placeholders';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-slate-100 text-slate-600',
  completed: 'bg-blue-100 text-blue-700',
};

export const BookingRequests = () => {
  const navigate = useNavigate();
  const storeVersion = useStoreVersion();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);

      try {
        const response = await bookingsAPI.getOwnerBookings();
        const data = response.data;
        setBookings(Array.isArray(data) ? data : (data?.bookings || []));
      } catch (error) {
        console.error('Error fetching booking requests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [storeVersion]);

  const totals = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter((booking) => booking.status === 'pending').length,
    approved: bookings.filter((booking) => booking.status === 'approved').length,
  }), [bookings]);

  const updateBookingStatus = async (id, action) => {
    try {
      if (action === 'approved') {
        await bookingsAPI.acceptBooking(id);
      } else if (action === 'declined') {
        await bookingsAPI.rejectBooking(id);
      }

      // Refresh the list immediately to reflect status & capacity updates
      const response = await bookingsAPI.getOwnerBookings();
      const data = response.data;
      setBookings(Array.isArray(data) ? data : (data?.bookings || []));
    } catch (error) {
      console.error('Error updating booking request:', error);
      alert(error?.response?.data?.message || error?.message || 'Failed to update booking status');
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <Navbar />

      <div className="px-4 pt-8">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Owner workspace
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">
                Booking Requests
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Review requests and approve or reject them from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/my-apartment')}
              className="rounded-full bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              My apartments
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-[24px] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Total Requests</p>
            <p className="mt-2 text-4xl font-black text-slate-900">{totals.total}</p>
          </div>
          <div className="rounded-[24px] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Pending Requests</p>
            <p className="mt-2 text-4xl font-black text-amber-600">{totals.pending}</p>
          </div>
          <div className="rounded-[24px] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Approved</p>
            <p className="mt-2 text-4xl font-black text-emerald-600">{totals.approved}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-8">
        <h2 className="mb-6 text-2xl font-black text-slate-900">Student Requests</h2>

        {loading ? (
          <div className="rounded-[28px] bg-white py-16 text-center text-slate-500 shadow-sm">
            Loading booking requests...
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const statusStyle = statusStyles[booking.status] || statusStyles.pending;

              return (
                <div key={booking._id} className="overflow-hidden rounded-[28px] bg-white shadow-sm">
                  <div className="grid gap-0 md:grid-cols-[260px_1fr]">
                    <div className="h-56 bg-slate-200 md:h-full">
                      <img
                        src={booking.apartment?.images?.[0] || APARTMENT_PLACEHOLDER}
                        alt={booking.apartment?.title || booking.apartment?.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="p-6">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-black text-slate-900">
                              {booking.student?.fullName}
                            </h3>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyle}`}>
                              {booking.status}
                            </span>
                          </div>

                          <p className="mt-2 text-slate-500">
                            {booking.student?.faculty} - {booking.student?.university}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            <i className="fas fa-phone mr-2 text-[#245999]"></i>
                            {booking.student?.phone}
                          </p>

                          <h4 className="mt-5 text-xl font-black text-slate-900">
                            {booking.apartment?.title || booking.apartment?.name}
                          </h4>
                          <p className="mt-2 text-slate-500">
                            <i className="fas fa-location-dot mr-2 text-[#245999]"></i>
                            {booking.apartment?.district}, {booking.apartment?.city}
                          </p>
                          <p className="mt-3 max-w-2xl text-slate-600">{booking.message}</p>

                          <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Check in</span>
                              <span className="mt-1 block font-semibold text-slate-900">{booking.checkInDate}</span>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Check out</span>
                              <span className="mt-1 block font-semibold text-slate-900">{booking.checkOutDate}</span>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Requested occupants</span>
                              <span className="mt-1 block font-semibold text-slate-900">{booking.requestedOccupants || 1}</span>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Apartment price</span>
                              <span className="mt-1 block font-semibold text-slate-900">${booking.apartment?.price}/mo</span>
                            </div>
                          </div>
                        </div>

                        <div className="min-w-[180px]">
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Submitted</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="mt-4 flex flex-col gap-3">
                            <button
                              type="button"
                              onClick={() => navigate(`/apartment/${booking.apartment?._id}`)}
                              className="rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
                            >
                              View apartment
                            </button>

                            {booking.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => updateBookingStatus(booking._id, 'approved')}
                                  className="rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateBookingStatus(booking._id, 'declined')}
                                  className="rounded-2xl bg-rose-600 px-4 py-3 font-semibold text-white transition hover:bg-rose-700"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[28px] bg-white py-20 text-center shadow-sm">
            <i className="fas fa-calendar-xmark text-6xl text-slate-300 mb-5"></i>
            <p className="text-lg font-bold text-slate-900">No booking requests yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
