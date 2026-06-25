import React from 'react';
import loadingImage from '../../assets/Loading.png';

export const Loading = ({ visible = true }) => {
  return (
    <div
      className={`fixed inset-0 z-[1000] transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 scale-[1.02]'
      }`}
      aria-hidden={!visible}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_rgba(15,23,42,0.92))]" />
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-[0_30px_80px_rgba(15,23,42,0.4)]">
          <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[340px]">
              <img
                src={loadingImage}
                alt="SOKON loading screen"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
            </div>

            <div className="flex flex-col justify-center gap-6 bg-slate-950/45 p-8 text-white md:p-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-200">
                  Loading
                </p>
                <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                  SOKON
                </h1>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-200">
                  Preparing apartments, locations, notifications, and routes.
                </p>
              </div>

              <div className="space-y-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-2/3 animate-[loadingBar_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-blue-300 via-white to-blue-300" />
                </div>
                <p className="text-xs text-slate-300">
                  Please wait while the homepage is prepared.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
