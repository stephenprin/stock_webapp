"use client";

export default function CreatingAccountPage() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center text-center px-4">
      <img
        src="/mechanic.gif"
        alt="Loading animation"
        className="w-40 h-40 mb-6"
      />

      <h1 className="text-2xl font-semibold text-white">
        Creating your account...
      </h1>

      <p className="text-gray-400 mt-3 max-w-sm">
        Please wait patiently while we set up your personalized investing
        experience.
      </p>
    </div>
  );
}
