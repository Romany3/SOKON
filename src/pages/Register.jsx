import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/apiClient';

export const Register = () => {
  const navigate = useNavigate();
  const { register, registerWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
    gender: '',
    college: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidPassword = (value) =>
    /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === 'role' && value !== 'client' ? { college: '' } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required.');
      return;
    }

    if (!isValidEmail(formData.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required.');
      return;
    }

    if (!formData.role) {
      setError('Please select an account type.');
      return;
    }

    if (formData.role === 'client' && !formData.college.trim()) {
      setError('College is required for client accounts.');
      return;
    }

    if (!formData.gender) {
      setError('Please select your gender.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!isValidPassword(formData.password)) {
      setError('Password must be at least 8 characters and include letters and numbers.');
      return;
    }

    setLoading(true);

    try {
      const registerData = {
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phone.trim(),
        password: formData.password,
        gender: formData.gender,
        college: formData.college.trim(),
        role: formData.role,
      };

      await register(registerData, formData.role);
      navigate('/home');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');

    if (!formData.role) {
      setError('Please select an account type before using Google sign up.');
      return;
    }

    setGoogleLoading(true);
    try {
      await registerWithGoogle(formData.role);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Google sign up failed. Please try again.'));
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f2f2]">
      <div className="w-full h-[30vh] bg-[#f2f2f2] flex items-center justify-center text-[#0A3D62]">
        <h1 className="text-[36px] font-bold drop-shadow-md">SOKON</h1>
      </div>

      <div className="w-full min-h-[70vh] text-center bg-[#f2f2f2]">
        <div className="bg-[#fcfcfc] min-h-[70vh] rounded-t-[60px] pt-[50px] px-4 pb-10">
          <div className="flex flex-col items-center">
            <h2 className="text-[24px] font-bold mb-2">Sign Up</h2>
            <p className="text-gray-600 mb-6">Create your account</p>

            {error && (
              <div className="mb-6 w-full max-w-md rounded-lg border border-red-400 bg-red-100 p-4 text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col items-center">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Full Name"
                className="mb-3 h-[50px] w-full rounded-[8px] border border-[#ccc] px-3"
              />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Email"
                className="mb-3 h-[50px] w-full rounded-[8px] border border-[#ccc] px-3"
              />

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Phone"
                className="mb-3 h-[50px] w-full rounded-[8px] border border-[#ccc] px-3"
              />

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="mb-3 h-[50px] w-full rounded-[8px] border border-[#ccc] px-3"
              >
                <option value="">Select Account Type</option>
                <option value="client">Client</option>
                <option value="owner">Owner</option>
              </select>

              {formData.role === 'client' && (
                <input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  placeholder="College"
                  className="mb-3 h-[50px] w-full rounded-[8px] border border-[#ccc] px-3"
                />
              )}

              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mb-3 h-[50px] w-full rounded-[8px] border border-[#ccc] px-3"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Password"
                className="mb-3 h-[50px] w-full rounded-[8px] border border-[#ccc] px-3"
              />

              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm Password"
                className="mb-4 h-[50px] w-full rounded-[8px] border border-[#ccc] px-3"
              />

              <button
                type="submit"
                disabled={loading}
                className="mb-4 h-[45px] w-[175px] rounded-[8px] bg-[#245999] text-white duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating Account...
                  </span>
                ) : (
                  'Sign Up'
                )}
              </button>
            </form>

            <div className="mt-4 flex justify-center gap-[24px] mb-[12px]">
              <div className="w-[48px] h-[48px] flex items-center justify-center rounded-full bg-[#f2f2f2] shadow-md hover:bg-gray-200 transition transform hover:-translate-y-0.5 hover:scale-105">
                <button type="button" aria-label="Google sign up" onClick={handleGoogleRegister} disabled={googleLoading} className="flex items-center justify-center border-0 bg-transparent p-0 disabled:opacity-50">
                  <i className="fa-brands fa-google text-[24px] text-[#245999]"></i>
                </button>
              </div>
              <div className="w-[48px] h-[48px] flex items-center justify-center rounded-full bg-[#f2f2f2] shadow-md hover:bg-gray-200 transition transform hover:-translate-y-0.5 hover:scale-105">
                <button type="button" aria-label="Apple sign up coming soon" className="flex items-center justify-center border-0 bg-transparent p-0">
                  <i className="fa-brands fa-apple text-[24px] text-[#245999]"></i>
                </button>
              </div>
              <div className="w-[48px] h-[48px] flex items-center justify-center rounded-full bg-[#f2f2f2] shadow-md hover:bg-gray-200 transition transform hover:-translate-y-0.5 hover:scale-105">
                <button type="button" aria-label="Facebook sign up coming soon" className="flex items-center justify-center border-0 bg-transparent p-0">
                  <i className="fa-brands fa-facebook text-[24px] text-[#245999]"></i>
                </button>
              </div>
            </div>

            <div className="mt-4 mb-8">
              <p className="text-gray-600">
                Already have an account?
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="ml-2 font-bold text-[#245999]"
                >
                  Login
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
