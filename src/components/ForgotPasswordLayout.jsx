import React from 'react';
import { Link } from 'react-router-dom';

export const ForgotPasswordLayout = ({ heroImage, children }) => {
  return (
    <div className="h-screen w-full bg-[#eef1f5]">

      {/* Hero Image */}
      <div className="w-full relative">

        <img
          src={heroImage}
          alt=""
          className="
          w-full
          object-contain
          object-top
          relative
          z-20
          md:mb-7
          "
        />

      </div>

      {/* Form Section */}
      <div
        className="
        relative
        z-10
        bg-white
        -mt-8
        sm:-mt-13
        md:-mt-16
        rounded-t-[35px]
        shadow-[0_-5px_20px_rgba(0,0,0,0.08)]
        lg:h-[40vh]
        md:h-[56vh]
        h-[74vh]
        px-6
        sm:px-10
        lg:pt-11
        py-10
        "
      >
        <div
          className="
          w-full
          max-w-md
          mx-auto
          flex
          flex-col
          items-center
          "
        >
          {children}

          <p className="mt-10 text-center text-sm text-[#6b7280]">
            Back to{" "}
            <Link
              to="/login"
              className="
              text-[#1a3b5d]
              font-medium
              hover:underline
              "
            >
              Login
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
};


export const ForgotPasswordField = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder
}) => (
  <div className="w-full mb-5">

    {label && (
      <label
        htmlFor={id}
        className="
        block
        mb-3
        text-center
        text-[15px]
        font-medium
        text-[#2d3436]
        "
      >
        {label}
      </label>
    )}

    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required
      className="
      w-full
      h-[52px]
      px-5
      rounded-xl
      border
      border-[#d1d1d1]
      bg-white
      shadow-sm
      text-[#2d3436]
      placeholder:text-[#b0b0b0]
      focus:outline-none
      focus:ring-2
      focus:ring-[#1a3b5d]/20
      focus:border-[#1a3b5d]
      transition
      "
    />

  </div>
);

export const ForgotPasswordButton = ({
  children,
  disabled,
  type='submit'
}) => (
  <button
    type={type}
    disabled={disabled}
    className="
    w-full
    h-[52px]
    rounded-xl
    bg-[#1a3b5d]
    text-white
    font-medium
    shadow-md
    hover:bg-[#15304d]
    transition-all
    hover:scale-[1.02]
    disabled:opacity-60
    "
  >
    {children}
  </button>
);

export const ForgotPasswordError = ({ message }) => (
  <div
    className="
    mb-5
    w-full
    p-3
    rounded-xl
    bg-red-50
    border
    border-red-200
    text-red-700
    text-center
    text-sm
    "
  >
    {message}
  </div>
);