import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ForgotPasswordLayout,
  ForgotPasswordField,
  ForgotPasswordButton,
  ForgotPasswordError,
} from '../components/ForgotPasswordLayout';
import { authAPI } from '../services/api';
import { getApiErrorMessage } from '../services/apiClient';
import forgetpassImg from '../assets/forgetpass.png';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const resetToken = location.state?.resetToken || window.sessionStorage.getItem('sokon_reset_token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
      setError('Password must be at least 8 characters and include letters and numbers.');
      return;
    }

    if (!resetToken) {
      setError('No password reset was requested. Please request a new code.');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword({ token: resetToken, password });
      window.sessionStorage.removeItem('sokon_reset_token');
      navigate('/login');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to reset password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ForgotPasswordLayout heroImage={forgetpassImg}>
      {error && <ForgotPasswordError message={error} />}

      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
        <ForgotPasswordField
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="New Password"
        />

        <ForgotPasswordField
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm New Password"
        />

        <ForgotPasswordButton disabled={loading}>
          {loading ? 'Saving...' : 'Finish'}
        </ForgotPasswordButton>
      </form>
    </ForgotPasswordLayout>
  );
};
