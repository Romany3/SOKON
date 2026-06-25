import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ForgotPasswordLayout,
  ForgotPasswordField,
  ForgotPasswordButton,
  ForgotPasswordError,
} from '../components/ForgotPasswordLayout';
import { authAPI } from '../services/api';
import { getApiErrorMessage } from '../services/apiClient';
import forgetpassImg from '../assets/forgetpass.png';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.forgotPassword({ email });
      navigate('/forgot-password/verify', { state: { email } });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to send verification code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ForgotPasswordLayout heroImage={forgetpassImg}>
      {error && <ForgotPasswordError message={error} />}

      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
        <ForgotPasswordField
          label="Enter Your Email Address"
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="example123@gmail.com"
        />

        <ForgotPasswordButton disabled={loading}>
          {loading ? 'Sending...' : 'Continue'}
        </ForgotPasswordButton>
      </form>
    </ForgotPasswordLayout>
  );
};
