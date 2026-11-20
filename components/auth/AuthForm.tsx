"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Lock,
  Mail,
  User,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  Send,
  Loader2,
  Clock,
  Sparkles,
} from "lucide-react";

import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface FormDataState {
  firstName: string;
  surname: string;
  email: string;
  school: string;
  dateOfBirth: string;
  phone: string;
  password: string;
}

type AuthMode = "login" | "register" | "forgot" | "verify";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const { login } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const urlError = searchParams.get("error");
  const [error, setError] = useState(urlError || "");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState<FormDataState>({
    firstName: "",
    surname: "",
    email: "",
    school: "",
    dateOfBirth: "",
    password: "",
    phone: "",
  });

  // Dedicated Verification State
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationReason, setVerificationReason] = useState<
    "register" | "unverified" | "three_months" | ""
  >("");
  const [verificationCooldown, setVerificationCooldown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Forgot password state
  const [resetData, setResetData] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSendingResetCode, setIsSendingResetCode] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);

  // Read URL search params on mount
  useEffect(() => {
    const requestedMode = searchParams.get("mode");
    const isUnverifiedParam = searchParams.get("unverified") === "true";
    const emailParam = searchParams.get("email");

    if (requestedMode === "verify" || isUnverifiedParam) {
      setMode("verify");
      if (emailParam) {
        setVerificationEmail(emailParam);
      }
      if (isUnverifiedParam) {
        setVerificationReason("unverified");
        setError("Your account is unverified. To protect the site, please verify your email before continuing.");
      }
    }
  }, [searchParams]);

  // Verification Cooldown countdown
  useEffect(() => {
    if (verificationCooldown <= 0) return;
    const timer = setInterval(() => {
      setVerificationCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [verificationCooldown]);

  // Handle Send Reset Code via Resend
  const handleSendResetCode = async () => {
    if (!resetData.email || !resetData.email.includes("@")) {
      setError("Please enter your registered email address first.");
      return;
    }

    setIsSendingResetCode(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetData.email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send reset code.");
      }

      setResetCodeSent(true);
      setSuccessMessage(data.message || "A 6-digit reset code was sent to your email!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset code.");
    } finally {
      setIsSendingResetCode(false);
    }
  };

  // Handle Resend Verification Code
  const handleResendVerificationCode = async () => {
    if (verificationCooldown > 0 || isResending) return;
    const targetEmail = verificationEmail || formData.email;
    if (!targetEmail) {
      setError("Email address is missing. Please return to sign in.");
      return;
    }

    setIsResending(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await api.auth.sendVerificationCode(targetEmail.trim());
      setSuccessMessage(res.message || "A fresh 6-digit verification code has been dispatched to your email!");
      setVerificationCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  // Handle Google Sign-in via standard OAuth 2.0 flow
  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    setError("");
    setSuccessMessage("");
    window.location.href = `/api/auth/google?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  // Handle Verification Submit
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = verificationEmail || formData.email;
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code sent to your email.");
      return;
    }

    if (!targetEmail) {
      setError("Email address is required for verification. Please sign in again.");
      return;
    }

    setIsVerifying(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await api.auth.verifyCode(targetEmail.trim(), verificationCode.trim());

      if (res.token && res.user) {
        const authUser = res.user as typeof res.user & {
          id?: string;
          onboardingCompleted?: boolean;
          school?: string;
          dateOfBirth?: string;
          firstName?: string;
          surname?: string;
        };

        login(res.token, {
          ...authUser,
          _id: authUser._id || authUser.id || "",
        });

        const isSchoolValid = Boolean(
          authUser.school &&
            authUser.school.trim() !== "" &&
            authUser.school !== "Pending Onboarding"
        );
        const isDobValid = Boolean(authUser.dateOfBirth);
        const isNameValid = Boolean(authUser.firstName?.trim() && authUser.surname?.trim());
        const isCompleted = Boolean(authUser.onboardingCompleted || (isNameValid && isSchoolValid && isDobValid));

        if (!isCompleted) {
          router.push("/onboarding");
        } else {
          router.push(redirectUrl);
        }
        router.refresh();
      } else {
        setSuccessMessage(res.message || "Email verified successfully! You may now sign in.");
        setTimeout(() => {
          setMode("login");
          setError("");
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed. Please check the code and try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      if (mode === "login") {
        const response = await api.auth.login({
          email: formData.email.trim(),
          password: formData.password,
        });

        // Security Wall check: Requires verification (e.g. 3 months or unverified)
        if (response.requiresVerification) {
          setVerificationEmail(response.email || formData.email.trim());
          setVerificationReason(
            (response.reason as "unverified" | "three_months") || "unverified"
          );
          setMode("verify");
          setVerificationCooldown(60);
          setSuccessMessage(
            response.message || "A 6-digit verification code has been dispatched to your email."
          );
          return;
        }

        // Login success: user logged in within 3 months and verified! Never asks for verification!
        if (response.token && response.user) {
          const authUser = response.user as typeof response.user & {
            id?: string;
            onboardingCompleted?: boolean;
            school?: string;
            dateOfBirth?: string;
            firstName?: string;
            surname?: string;
          };

          login(response.token, {
            ...authUser,
            _id: authUser._id || authUser.id || "",
          });

          const isSchoolValid = Boolean(
            authUser.school &&
              authUser.school.trim() !== "" &&
              authUser.school !== "Pending Onboarding"
          );
          const isDobValid = Boolean(authUser.dateOfBirth);
          const isNameValid = Boolean(authUser.firstName?.trim() && authUser.surname?.trim());
          const isCompleted = Boolean(authUser.onboardingCompleted || (isNameValid && isSchoolValid && isDobValid));

          if (!isCompleted) {
            router.push("/onboarding");
          } else {
            router.push(redirectUrl);
          }
          router.refresh();
        } else {
          setError(response.message || "Login failed");
        }
      } else if (mode === "register") {
        // Password strength client validation
        if (formData.password.length < 8 || !/[a-zA-Z]/.test(formData.password) || !/\d/.test(formData.password)) {
          setError("Password must be at least 8 characters long and contain both letters and numbers.");
          setIsLoading(false);
          return;
        }

        const response = await api.auth.register({
          firstName: formData.firstName.trim(),
          surname: formData.surname.trim(),
          email: formData.email.trim(),
          password: formData.password,
          school: formData.school || "Pending Onboarding",
          dateOfBirth: formData.dateOfBirth || new Date("2000-01-01").toISOString(),
          phone: formData.phone,
        });

        // Always requires email verification upon sign up
        if (response.requiresVerification) {
          setVerificationEmail(response.email || formData.email.trim());
          setVerificationReason("register");
          setMode("verify");
          setVerificationCooldown(60);
          setSuccessMessage(
            response.message ||
              "Registration initiated! A 6-digit verification code has been sent to your email. Enter it below to activate your account."
          );
          return;
        }

        if (response.token && response.user) {
          const authUser = response.user as typeof response.user & { id?: string };
          login(response.token, {
            ...authUser,
            _id: authUser._id || authUser.id || "",
            onboardingCompleted: false,
          });
          router.push("/onboarding");
          router.refresh();
        } else {
          setError(response.message || "Registration failed");
        }
      } else if (mode === "forgot") {
        if (!resetData.email || !resetData.email.includes("@")) {
          setError("Please enter your registered email address.");
          setIsLoading(false);
          return;
        }

        if (!resetData.code || resetData.code.trim().length !== 6) {
          setError("Please enter the 6-digit verification code sent to your email.");
          setIsLoading(false);
          return;
        }

        if (resetData.newPassword.length < 8 || !/[a-zA-Z]/.test(resetData.newPassword) || !/\d/.test(resetData.newPassword)) {
          setError("New password must be at least 8 characters long and contain both letters and numbers.");
          setIsLoading(false);
          return;
        }

        if (resetData.newPassword !== resetData.confirmPassword) {
          setError("Passwords do not match.");
          setIsLoading(false);
          return;
        }

        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: resetData.email.trim(),
            code: resetData.code.trim(),
            newPassword: resetData.newPassword.trim(),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to reset password");
        }

        setSuccessMessage(data.message || "Password has been reset successfully! Please sign in.");
        setResetData({ email: "", code: "", newPassword: "", confirmPassword: "" });
        setResetCodeSent(false);
        setTimeout(() => {
          setMode("login");
          setError("");
        }, 2000);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <Image
          src="/icon.png"
          alt="Chroma Diaries"
          width={48}
          height={48}
          className="mx-auto mb-4"
        />

        <h1 className="text-3xl font-serif font-bold text-brand-dark mb-2">
          {mode === "login"
            ? "Welcome Back"
            : mode === "register"
            ? "Create an Account"
            : mode === "forgot"
            ? "Reset Password"
            : "Security Verification"}
        </h1>

        <p className="text-xs tracking-[0.2em] uppercase font-bold text-emerald-950/40">
          {mode === "login"
            ? "Enter your literary studio"
            : mode === "register"
            ? "Join our circle of storytellers"
            : mode === "forgot"
            ? "Set new password for your account"
            : verificationReason === "three_months"
            ? "3-Month Inactivity Verification"
            : "Verify Email to Access Site"}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl text-xs font-semibold text-center animate-in fade-in leading-relaxed">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-2xl text-xs font-semibold text-center flex items-center justify-center gap-2 animate-in fade-in leading-relaxed">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Google Sign-in Button (Hidden in Verify and Forgot modes) */}
      {mode !== "forgot" && mode !== "verify" && (
        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-4 px-6 bg-white border border-emerald-950/15 rounded-2xl font-medium text-xs text-emerald-950 uppercase tracking-widest hover:bg-emerald-950/5 active:scale-98 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-950" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-emerald-950/10" />
            <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-emerald-950/40">
              Or with email
            </span>
            <div className="flex-grow border-t border-emerald-950/10" />
          </div>
        </div>
      )}

      {/* DEDICATED VERIFICATION MODE */}
      {mode === "verify" ? (
        <form onSubmit={handleVerifySubmit} className="space-y-5 animate-in fade-in duration-300">
          {/* Security Wall Reason Banner */}
          {verificationReason === "three_months" ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-left space-y-1.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>3-Month Inactivity Security Wall</span>
              </div>
              <p className="text-[12px] text-amber-900/80 leading-relaxed">
                For your protection, sign-in after 3 months requires email verification. We never ask for verification if your last sign-in was under 3 months.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-left space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
                <span>Email Verification Wall</span>
              </div>
              <p className="text-[12px] text-emerald-950/80 leading-relaxed">
                Unverified accounts cannot access the site. Enter the 6-digit code sent to your email to verify your identity.
              </p>
            </div>
          )}

          {/* Email destination badge */}
          <div className="flex items-center justify-between p-3.5 bg-emerald-950/5 border border-emerald-950/10 rounded-2xl text-xs">
            <div className="flex items-center gap-2 text-emerald-950/70 truncate">
              <Mail className="w-4 h-4 shrink-0 text-emerald-800" />
              <span className="font-semibold truncate">{verificationEmail || formData.email}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccessMessage("");
              }}
              className="text-[10px] font-bold text-emerald-900 uppercase hover:underline ml-2 shrink-0 cursor-pointer"
            >
              Change
            </button>
          </div>

          {/* 6-Digit Verification Code Input */}
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-950/60 block pl-1">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-white border border-emerald-950/15 rounded-2xl py-4 text-center font-mono font-extrabold text-2xl tracking-[0.5em] text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-950/20 shadow-inner"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying || verificationCode.length !== 6}
            className="w-full py-5 bg-brand-main text-brand-dark rounded-full font-bold text-xs tracking-[0.3em] hover:bg-brand-accent hover:text-white transition-all shadow-xl shadow-brand-main/20 flex items-center justify-center gap-4 group active:scale-95 disabled:opacity-50 cursor-pointer mt-2"
          >
            {isVerifying ? (
              <Loader2 className="w-5 h-5 animate-spin text-brand-dark" />
            ) : (
              <>
                <span>VERIFY & ENTER SITE</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Resend and Back controls */}
          <div className="pt-2 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleResendVerificationCode}
              disabled={verificationCooldown > 0 || isResending}
              className="text-xs font-bold text-emerald-950 uppercase tracking-wider hover:text-emerald-800 disabled:opacity-40 cursor-pointer flex items-center gap-2 transition-colors"
            >
              {isResending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>
                {verificationCooldown > 0
                  ? `Resend Code in ${verificationCooldown}s`
                  : "Resend 6-Digit Code"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccessMessage("");
              }}
              className="text-[11px] font-medium text-emerald-950/50 hover:text-emerald-950 cursor-pointer transition-colors"
            >
              ← Return to Sign In
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  icon={User}
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      firstName: value,
                    }))
                  }
                />

                <Input
                  icon={User}
                  placeholder="Surname"
                  value={formData.surname}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      surname: value,
                    }))
                  }
                />
              </div>
            </>
          )}

          {mode !== "forgot" ? (
            <>
              <Input
                type="email"
                icon={Mail}
                placeholder="Email Address"
                value={formData.email}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    email: value,
                  }))
                }
              />

              <div className="space-y-1">
                <Input
                  type="password"
                  icon={Lock}
                  placeholder={
                    mode === "register"
                      ? "Password (min 8 chars, letter & number)"
                      : "Password"
                  }
                  value={formData.password}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: value,
                    }))
                  }
                />
                {mode === "register" && (
                  <p className="text-[10px] text-emerald-950/50 pl-3">
                    Must be at least 8 characters with at least one letter and one number.
                  </p>
                )}
              </div>

              {mode === "login" && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError("");
                      setSuccessMessage("");
                    }}
                    className="text-[11px] font-bold text-emerald-950/60 hover:text-emerald-950 hover:underline cursor-pointer transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="email"
                    icon={Mail}
                    placeholder="Your Registered Email"
                    value={resetData.email}
                    onChange={(value) =>
                      setResetData((prev) => ({
                        ...prev,
                        email: value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={handleSendResetCode}
                    disabled={isSendingResetCode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-emerald-950 text-cream-50 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-900 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingResetCode ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        <span>{resetCodeSent ? "Resend OTP" : "Send Reset OTP"}</span>
                      </>
                    )}
                  </button>
                </div>

                {resetCodeSent && (
                  <div className="p-3.5 bg-emerald-950/5 border border-emerald-950/10 rounded-2xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px] text-emerald-950/70 font-medium">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
                        Enter 6-digit code sent to your email:
                      </span>
                    </div>

                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={resetData.code}
                      onChange={(e) =>
                        setResetData((prev) => ({
                          ...prev,
                          code: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      className="w-full bg-white border border-emerald-950/15 rounded-xl px-4 py-2 text-center font-mono font-bold text-base tracking-widest outline-none focus:ring-2 focus:ring-emerald-950/15"
                      required
                    />
                  </div>
                )}
              </div>

              <Input
                type="password"
                icon={KeyRound}
                placeholder="New Password (min 8 chars, letter & number)"
                value={resetData.newPassword}
                onChange={(value) =>
                  setResetData((prev) => ({
                    ...prev,
                    newPassword: value,
                  }))
                }
              />

              <Input
                type="password"
                icon={Lock}
                placeholder="Confirm New Password"
                value={resetData.confirmPassword}
                onChange={(value) =>
                  setResetData((prev) => ({
                    ...prev,
                    confirmPassword: value,
                  }))
                }
              />
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-brand-main text-brand-dark rounded-full font-bold text-xs tracking-[0.3em] hover:bg-brand-accent hover:text-white transition-all shadow-xl shadow-brand-main/20 flex items-center justify-center gap-4 group active:scale-95 disabled:opacity-50 cursor-pointer mt-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-brand-dark/20 border-t-brand-dark rounded-full animate-spin" />
            ) : (
              <>
                {mode === "login"
                  ? "SIGN IN"
                  : mode === "register"
                  ? "REGISTER & ONBOARD"
                  : "RESET PASSWORD"}

                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      )}

      {mode !== "verify" && (
        <div className="pt-8 text-center space-y-2">
          {mode === "forgot" ? (
            <button
              onClick={() => {
                setMode("login");
                setError("");
                setSuccessMessage("");
              }}
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-950 underline underline-offset-4 cursor-pointer decoration-emerald-950/20 hover:text-emerald-800 transition-all"
            >
              ← Back to Sign In
            </button>
          ) : (
            <>
              <p className="text-sm text-emerald-950/40 font-medium">
                {mode === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </p>

              <button
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError("");
                  setSuccessMessage("");
                }}
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-950 underline underline-offset-2 cursor-pointer decoration-emerald-950/20 hover:text-emerald-800 transition-all"
              >
                {mode === "login" ? "Join the collective" : "Enter your studio"}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

interface InputProps {
  icon: React.ElementType;
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (value: string) => void;
}

function Input({
  icon: Icon,
  value,
  placeholder,
  type = "text",
  onChange,
}: InputProps) {
  return (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-950/20" />

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-emerald-950/5 border-none rounded-2xl py-4 pl-14 pr-6 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-950/10 transition-all placeholder:text-emerald-950/20"
        required
      />
    </div>
  );
}
