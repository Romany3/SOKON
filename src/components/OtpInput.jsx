import React, { useRef } from 'react';

export const OtpInput = ({ length = 6, value, onChange }) => {
  const inputsRef = useRef([]);

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const focusInput = (index) => {
    inputsRef.current[index]?.focus();
  };

  const handleChange = (index, digit) => {
    const sanitized = digit.replace(/\D/g, '').slice(-1);
    const next = digits.map((char, i) => (i === index ? sanitized : char)).join('');
    onChange(next.replace(/\s/g, ''));

    if (sanitized && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    focusInput(Math.min(pasted.length, length - 1));
  };

  return (
    <div className="flex justify-center gap-4">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          className="
w-12
h-12
sm:w-14
sm:h-14
md:w-16
md:h-16
text-center
text-lg
font-semibold
border
border-[#d1d1d1]
rounded-xl
bg-white
shadow-sm
text-[#2d3436]
focus:outline-none
focus:ring-2
focus:ring-[#1a3b5d]/20
focus:border-[#1a3b5d]
transition
"
        />
      ))}
    </div>
  );
};
