import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { apartmentsAPI } from '../services/api';
import { LocationPickerModal } from '../components/LocationPickerModal';

export const AddApartment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description_en: '',
    price: '',
    city: 'Asyut',
    district: '',
    address: '',
    beds: '',
    rooms: '',
    bathrooms: '',
    floor: '',
    latitude: '',
    longitude: '',
    maxPeople: 4,
    images: [],
    video: null,
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    setFormData((current) => ({
      ...current,
      images: [...current.images, ...files],
    }));
    if (errors.images) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
  };

  const handleRemoveImage = (index) => {
    setFormData((current) => ({
      ...current,
      images: current.images.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleLocationSelect = (coordinates) => {
    setFormData((current) => ({
      ...current,
      latitude: coordinates.lat.toFixed(6),
      longitude: coordinates.lng.toFixed(6),
    }));
    if (errors.location) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.location;
        return newErrors;
      });
    }
  };

  const changeCapacity = (delta) => {
    setFormData((current) => ({
      ...current,
      maxPeople: Math.max(1, Number(current.maxPeople || 1) + delta),
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Apartment name is required';
    if (!formData.description_en.trim()) newErrors.description_en = 'Description is required';
    if (!formData.price) newErrors.price = 'Price is required';
    if (!formData.district) newErrors.district = 'District is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.beds) newErrors.beds = 'Bedrooms count is required';
    if (!formData.rooms) newErrors.rooms = 'Living rooms/Total rooms count is required';
    if (!formData.bathrooms) newErrors.bathrooms = 'Bathrooms count is required';
    if (!formData.floor && formData.floor !== 0) newErrors.floor = 'Floor number is required';
    if (!formData.latitude || !formData.longitude) newErrors.location = 'Please pick a location on the map';
    if (formData.images.length === 0) newErrors.images = 'At least one image is required';
    if (!formData.video) newErrors.video = 'Apartment video is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description_en', formData.description_en);
      form.append('price', Number(formData.price));
      form.append('city', formData.city);
      form.append('district', formData.district);
      form.append('address', formData.address);
      form.append('beds', Number(formData.beds));
      form.append('rooms', Number(formData.rooms));
      form.append('bathrooms', Number(formData.bathrooms));
      form.append('floor', Number(formData.floor));
      form.append('latitude', formData.latitude);
      form.append('longitude', formData.longitude);
      form.append('max_people', Number(formData.maxPeople));
      form.append('available_people', Number(formData.maxPeople));

      formData.images.forEach((image) => {
        form.append('images', image);
      });

      if (formData.video) {
        form.append('video', formData.video);
      }

      await apartmentsAPI.createApartment(form);

      setSuccessMessage('Apartment added successfully! It will be reviewed before publishing.');
      setTimeout(() => {
        navigate('/my-apartment');
      }, 1800);
    } catch (requestError) {
      setErrors({ submit: requestError?.message || 'Failed to add apartment. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f8fafc]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-2">Add New Apartment</h1>
          <p className="text-slate-500">List your property on Sokon and reach thousands of students</p>
        </div>

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3">
            <i className="fas fa-circle-exclamation text-xl"></i>
            {errors.submit}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-3">
            <i className="fas fa-circle-check text-xl"></i>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm">1</span>
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full">
                <label className="block text-slate-700 font-bold mb-2">Apartment Name *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-5 py-4 border ${errors.title ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition`}
                  placeholder="e.g., Modern 3-Bedroom Apartment near Faculty of Medicine"
                />
                {errors.title && <p className="mt-1 text-sm text-red-500 font-medium ml-2">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-2">Price per Month (EGP) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className={`w-full px-5 py-4 border ${errors.price ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition`}
                  placeholder="5000"
                />
                {errors.price && <p className="mt-1 text-sm text-red-500 font-medium ml-2">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-2">City *</label>
                <input
                  type="text"
                  value="Asyut"
                  disabled
                  className="w-full px-5 py-4 border border-slate-200 bg-slate-50 text-slate-500 rounded-2xl cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-2">District *</label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className={`w-full px-5 py-4 border ${errors.district ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition`}
                >
                  <option value="">Select District</option>
                  <option value="فريال">فريال</option>
                  <option value="سيد">سيد</option>
                  <option value="الجمهورية">الجمهورية</option>
                  <option value="يسري راغب">يسري راغب</option>
                  <option value="قلتة">قلتة</option>
                  <option value="سيتي">سيتي</option>
                  <option value="شركة قلتة">شركة قلتة</option>
                </select>
                {errors.district && <p className="mt-1 text-sm text-red-500 font-medium ml-2">{errors.district}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-2">Full Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full px-5 py-4 border ${errors.address ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition`}
                  placeholder="Street name, Building number..."
                />
                {errors.address && <p className="mt-1 text-sm text-red-500 font-medium ml-2">{errors.address}</p>}
              </div>
            </div>

            <div className={`mt-8 rounded-3xl border-2 border-dashed ${errors.location ? 'border-red-300 bg-red-50' : 'border-primary/20 bg-slate-50'} p-6`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Map Location *</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {formData.latitude && formData.longitude
                      ? `Coordinates: ${formData.latitude}, ${formData.longitude}`
                      : 'Please select the exact apartment location on the map.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLocationPickerOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 font-bold text-white transition hover:opacity-90 shadow-md shadow-primary/20"
                >
                  <i className="fas fa-map-marker-alt"></i>
                  Open Map Picker
                </button>
              </div>
              {errors.location && <p className="mt-2 text-sm text-red-500 font-medium">{errors.location}</p>}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm">2</span>
              Apartment Details
            </h2>

            <div className="mb-8 rounded-[28px] bg-slate-50 p-6 border border-slate-100">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Max Capacity *</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Maximum number of students allowed in this apartment.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => changeCapacity(-1)}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 text-xl font-black text-slate-700 shadow-sm transition hover:bg-slate-100"
                  >
                    -
                  </button>
                  <div className="min-w-[100px] rounded-2xl bg-primary px-6 py-3 text-center shadow-lg shadow-primary/20">
                    <span className="block text-3xl font-black text-white">{formData.maxPeople}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => changeCapacity(1)}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 text-xl font-black text-slate-700 shadow-sm transition hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-slate-700 font-bold mb-2">Bedrooms *</label>
                <input
                  type="number"
                  name="beds"
                  value={formData.beds}
                  onChange={handleChange}
                  className={`w-full px-5 py-4 border ${errors.beds ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition`}
                  placeholder="3"
                />
                {errors.beds && <p className="mt-1 text-sm text-red-500 font-medium">{errors.beds}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-2">Living Rooms *</label>
                <input
                  type="number"
                  name="rooms"
                  value={formData.rooms}
                  onChange={handleChange}
                  className={`w-full px-5 py-4 border ${errors.rooms ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition`}
                  placeholder="1"
                />
                {errors.rooms && <p className="mt-1 text-sm text-red-500 font-medium">{errors.rooms}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-2">Bathrooms *</label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  className={`w-full px-5 py-4 border ${errors.bathrooms ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition`}
                  placeholder="2"
                />
                {errors.bathrooms && <p className="mt-1 text-sm text-red-500 font-medium">{errors.bathrooms}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-2">Floor *</label>
                <input
                  type="number"
                  name="floor"
                  value={formData.floor}
                  onChange={handleChange}
                  className={`w-full px-5 py-4 border ${errors.floor ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition`}
                  placeholder="2"
                />
                {errors.floor && <p className="mt-1 text-sm text-red-500 font-medium">{errors.floor}</p>}
              </div>
            </div>

            <div className="mt-8">
              <label className="block text-slate-700 font-bold mb-2">Apartment Description *</label>
              <textarea
                name="description_en"
                value={formData.description_en}
                onChange={handleChange}
                rows="5"
                className={`w-full px-5 py-4 border ${errors.description_en ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition`}
                placeholder="Describe your apartment features, nearby services, etc..."
              />
              {errors.description_en && <p className="mt-1 text-sm text-red-500 font-medium">{errors.description_en}</p>}
            </div>
          </div>

          {/* Media */}
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm">3</span>
              Media Uploads
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Image Upload */}
              <div>
                <label className="block text-slate-700 font-bold mb-4">Photos * (Min 1)</label>
                <div className={`border-2 border-dashed ${errors.images ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-primary bg-slate-50'} rounded-3xl p-8 text-center cursor-pointer transition`}>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="images"
                  />
                  <label htmlFor="images" className="cursor-pointer block">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                       <i className="fas fa-images text-2xl text-primary"></i>
                    </div>
                    <p className="text-slate-700 font-bold">Add Apartment Photos</p>
                    <p className="text-slate-500 text-sm mt-1">Upload high quality images</p>
                  </label>
                </div>
                {errors.images && <p className="mt-2 text-sm text-red-500 font-medium">{errors.images}</p>}

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    {formData.images.map((file, index) => {
                      const url = file instanceof File ? URL.createObjectURL(file) : file;
                      return (
                        <div key={index} className="relative group aspect-square rounded-xl overflow-hidden shadow-sm">
                          <img src={url} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-white/90 text-red-500 w-7 h-7 rounded-full shadow-sm flex items-center justify-center hover:bg-red-500 hover:text-white transition"
                          >
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-slate-700 font-bold mb-4">Apartment Video * (Min 1)</label>
                <div className={`border-2 border-dashed ${errors.video ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-primary bg-slate-50'} rounded-3xl p-8 text-center cursor-pointer transition`}>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                       setFormData({ ...formData, video: e.target.files[0] });
                       if (errors.video) setErrors(prev => ({...prev, video: null}));
                    }}
                    className="hidden"
                    id="video"
                  />
                  <label htmlFor="video" className="cursor-pointer block">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                       <i className="fas fa-video text-2xl text-primary"></i>
                    </div>
                    <p className="text-slate-700 font-bold">{formData.video ? 'Change Video' : 'Add Apartment Video'}</p>
                    <p className="text-slate-500 text-sm mt-1">Short walkthrough video</p>
                  </label>
                </div>
                {errors.video && <p className="mt-2 text-sm text-red-500 font-medium">{errors.video}</p>}

                {formData.video && (
                  <div className="mt-6 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                    <video
                      controls
                      className="w-full aspect-video object-cover"
                      src={URL.createObjectURL(formData.video)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/my-apartment')}
              className="flex-1 bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                   <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   Publishing Apartment...
                </span>
              ) : 'Publish Apartment'}
            </button>
          </div>
        </form>
      </div>

      {isLocationPickerOpen && (
        <LocationPickerModal
          open={isLocationPickerOpen}
          initialCoordinates={
            formData.latitude && formData.longitude
              ? {
                  lat: Number(formData.latitude),
                  lng: Number(formData.longitude),
                }
              : undefined
          }
          onClose={() => setIsLocationPickerOpen(false)}
          onSelect={handleLocationSelect}
        />
      )}
    </div>
  );
};
