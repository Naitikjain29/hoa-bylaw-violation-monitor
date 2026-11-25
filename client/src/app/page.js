
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  FiShield,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiCheckCircle,
  FiHome
} from "react-icons/fi";

import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter your email and password");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);

      const user = await login(email.trim(), password);

      toast.success("Login successful!");

      // Role-based dashboard navigation
      const dashboardRoutes = {
        admin: "/admin/dashboard",
        inspector: "/inspector/dashboard",
        board_member: "/board/dashboard",
        homeowner: "/homeowner/dashboard"
      };

      const destination =
        dashboardRoutes[user.role] || "/";

      router.replace(destination);

    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Login failed. Please check your credentials.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl min-h-[650px] bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">

        {/* LEFT SECTION */}
        <section className="hidden lg:flex flex-col justify-between bg-[#101f3c] text-white p-12 relative overflow-hidden">

          <div className="absolute w-80 h-80 bg-blue-500/10 rounded-full -top-28 -right-20" />
          <div className="absolute w-96 h-96 bg-blue-400/10 rounded-full -bottom-40 -left-20" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <FiShield size={25} />
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-wide">
                  HOA MONITOR
                </h1>
                <p className="text-xs text-blue-200">
                  Community Management System
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-md">
            <span className="inline-flex items-center gap-2 bg-white/10 text-blue-200 px-4 py-2 rounded-full text-sm mb-7">
              <FiCheckCircle />
              Smart Community Management
            </span>

            <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              Manage Your Community With Confidence.
            </h2>

            <p className="text-slate-300 leading-7">
              Monitor properties, manage bylaw violations,
              schedule inspections and keep your community
              organized in one secure platform.
            </p>

            <div className="mt-10 space-y-5">
              {[
                "Centralized property management",
                "Violation tracking and monitoring",
                "Inspection and notice management"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <FiCheckCircle className="text-blue-400" size={20} />
                  <span className="text-sm text-slate-200">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 text-sm text-slate-400">
            © 2026 HOA Monitor. All rights reserved.
          </div>
        </section>

        {/* RIGHT SECTION */}
        <section className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">

          <div className="max-w-md w-full mx-auto">

            <div className="lg:hidden flex justify-center mb-10">
              <div className="w-14 h-14 bg-blue-900 text-white rounded-2xl flex items-center justify-center">
                <FiShield size={28} />
              </div>
            </div>

            <div className="mb-9">
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-4">
                <FiHome size={17} />
                HOA BYLAW MONITOR
              </div>

              <h2 className="text-3xl font-bold text-slate-900">
                Welcome Back
              </h2>

              <p className="text-slate-500 mt-2">
                Sign in to access your management dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* EMAIL */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>

                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-13 pl-12 pr-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>

                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-13 pl-12 pr-12 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <FiEyeOff size={19} />
                    ) : (
                      <FiEye size={19} />
                    )}
                  </button>
                </div>
              </div>

              {/* REMEMBER */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 accent-blue-700"
                />

                <label htmlFor="remember" className="text-sm text-slate-600">
                  Remember me
                </label>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-13 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-xl flex items-center justify-center gap-3 transition shadow-lg shadow-blue-900/15 disabled:opacity-60"
              >
                {loading ? "Signing In..." : "Sign In"}
                {!loading && <FiArrowRight size={19} />}
              </button>

            </form>

            <div className="mt-10 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Secure access · Role-based authorization
              </p>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}
