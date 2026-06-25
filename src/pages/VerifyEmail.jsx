import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ForgotPasswordLayout,
  ForgotPasswordButton,
  ForgotPasswordError,
} from '../components/ForgotPasswordLayout';
import { OtpInput } from '../components/OtpInput';
import { authAPI } from '../services/api';
import { getApiErrorMessage } from '../services/apiClient';
import verificationImg from '../assets/forgetpass.png';

export const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.verifyEmail({ email, otp });
      const resetToken =
        response?.resetToken ||
        response?.token ||
        response?.data?.resetToken ||
        response?.data?.token ||
        '';

      if (!resetToken) {
        throw new Error('Verification succeeded but no reset token was returned.');
      }

      window.sessionStorage.setItem('sokon_reset_token', resetToken);
      navigate('/forgot-password/reset', { state: { email, resetToken } });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid verification code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ForgotPasswordLayout heroImage={verificationImg}>
      {error && <ForgotPasswordError message={error} />}

      <p className="mb-4 max-w-[340px] text-center text-[14px] text-[#6b7280] leading-relaxed">
        We will send you one time password this email address.
      </p>

      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
        <OtpInput value={otp} onChange={setOtp} length={6} />

        <div className="mt-8 w-full flex justify-center">
          <ForgotPasswordButton disabled={loading}>
            {loading ? 'Verifying...' : 'Submit'}
          </ForgotPasswordButton>
        </div>
      </form>
    </ForgotPasswordLayout>
  );
};
