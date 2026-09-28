"use client";

import React, { useState, useEffect, useRef } from "react";

import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  School,
  Calendar,
  Phone,
  BookOpen,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Upload,
  Heart,
  Feather,
  Quote,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import AgeBadge from "@/components/AgeBadge";
import { calculateAge, getAgeCategory } from "@/lib/utils/age";

const GENRES = [
  { id: "poetry", name: "Poetry", icon: Feather, desc: "Rhymes, verses, and lyrical reflections" },
  { id: "short-stories", name: "Short Stories", icon: BookOpen, desc: "Compelling narratives and fiction" },
  { id: "essays", name: "Essays & Articles", icon: Quote, desc: "Critical thinking and analytical prose" },
  { id: "memoirs", name: "Personal Memoirs", icon: Heart, desc: "Lived experiences and poignant chronicles" },
  { id: "opinion", name: "Opinion Pieces", icon: Sparkles, desc: "Perspectives on modern society & culture" },
  { id: "creative-nonfiction", name: "Creative Non-Fiction", icon: BookOpen, desc: "True events told with literary artistry" },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    surname: user?.surname || "",
    bio: user?.bio || "",
    school: user?.school || "",
    phone: user?.phone || "",
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
    avatar: user?.avatar || "",
    avatarPublicId: user?.avatarPublicId || "",
    selectedGenres: (user?.genres || []) as string[],
  });
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar || "");
  const initializedUserIdRef = useRef<string | null>(null);

  // Populate existing user info when user becomes available
  useEffect(() => {
    if (user && user._id !== initializedUserIdRef.current) {
      initializedUserIdRef.current = user._id;
      queueMicrotask(() => {
        setFormData((prev) => ({
          ...prev,
          firstName: prev.firstName || user.firstName || "",
          surname: prev.surname || user.surname || "",
          bio: prev.bio || user.bio || "",
          school: prev.school || user.school || "",
          phone: prev.phone || user.phone || "",
          dateOfBirth: prev.dateOfBirth || (user.dateOfBirth ? user.dateOfBirth.split("T")[0] : ""),
          avatar: prev.avatar || user.avatar || "",
          avatarPublicId: prev.avatarPublicId || user.avatarPublicId || "",
          selectedGenres: prev.selectedGenres.length > 0 ? prev.selectedGenres : (user.genres || []),
        }));
        if (user.avatar) {
          setAvatarPreview(user.avatar);
        }
      });
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const toggleGenre = (genreId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedGenres.includes(genreId);
      return {
        ...prev,
        selectedGenres: exists
          ? prev.selectedGenres.filter((id) => id !== genreId)
          : [...prev.selectedGenres, genreId],
      };
    });
  };

  const validateStep = (step: number) => {
    setError("");
    if (step === 1) {
      if (!formData.firstName.trim() || !formData.surname.trim()) {
        setError("Please enter your first name and surname.");
        return false;
      }
    } else if (step === 2) {
      if (!formData.school.trim()) {
        setError("Please enter your school, college, or university.");
        return false;
      }
    } else if (step === 3) {
      if (!formData.dateOfBirth) {
        setError("Please select your date of birth for age category verification.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleComplete = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    setError("");

    try {
      let avatarUrl = formData.avatar;
      let avatarPublicId = formData.avatarPublicId;

      if (selectedAvatarFile) {
        try {
          const uploadRes = await api.users.uploadAvatar(selectedAvatarFile);
          if (uploadRes.url) {
            avatarUrl = uploadRes.url;
            avatarPublicId = uploadRes.publicId;
          }
        } catch (uploadErr) {
          console.error("AVATAR UPLOAD FAILED:", uploadErr);
          // Non-blocking: continue updating user profile
        }
      }

      const updated = await api.users.updateMe({
        firstName: formData.firstName.trim(),
        surname: formData.surname.trim(),
        bio: formData.bio.trim(),
        school: formData.school.trim(),
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth,
        avatar: avatarUrl || undefined,
        avatarPublicId: avatarPublicId || undefined,
        genres: formData.selectedGenres,
        onboardingCompleted: true,
      });

      const token = localStorage.getItem("token") || "";
      if (token && updated) {
        login(token, {
          ...updated,
          _id: updated._id || updated.id || "",
          onboardingCompleted: true,
        });
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("ONBOARDING ERROR:", err);
      setError(err instanceof Error ? err.message : "Failed to complete onboarding. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const computedAge = formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : null;
  const computedCategory = computedAge !== null ? getAgeCategory(computedAge) : null;

  return (
    <div className="w-full max-w-2xl bg-white rounded-[2.5rem] border border-emerald-950/10 shadow-2xl p-6 sm:p-12 relative overflow-hidden">
      {/* Decorative backdrop gradients */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

      {/* Header & Step progress */}
      <div className="relative z-10 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-emerald-950 text-cream-50 flex items-center justify-center font-serif text-sm font-bold shadow-md">
              {currentStep}
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-950/60">
              Step {currentStep} of 4
            </span>
          </div>

          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-950/5 px-3 py-1 rounded-full">
            Author Profile Setup
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-emerald-950/5 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-emerald-900 transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-emerald-950 mb-2">
          {currentStep === 1 && "Personalize Your Literary Identity"}
          {currentStep === 2 && "Educational Institution & Contact"}
          {currentStep === 3 && "Date of Birth & Age Verification"}
          {currentStep === 4 && "Select Your Writing Genres"}
        </h1>

        <p className="text-sm text-emerald-950/60 leading-relaxed">
          {currentStep === 1 && "Enter your full name, profile picture, and a brief author biography."}
          {currentStep === 2 && "Share your school, college, or university affiliation and phone number."}
          {currentStep === 3 && "We use your date of birth to assign your tailored author age category badge."}
          {currentStep === 4 && "Choose the literary styles and categories you love writing or exploring most."}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl text-xs font-semibold text-center animate-in fade-in">
          {error}
        </div>
      )}

      {/* Step 1: Personal info & Avatar */}
      {currentStep === 1 && (
        <div className="space-y-6 relative z-10 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-emerald-950/5 border border-emerald-950/5">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-emerald-950/10 border-2 border-dashed border-emerald-950/20 flex items-center justify-center shrink-0">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Avatar Preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-emerald-950/30" />
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-950 text-cream-50 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer hover:bg-emerald-900 transition-all shadow-md">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Author Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-emerald-950/40 mt-1.5">
                Recommended: Square PNG or JPG, max 5MB.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-950/70 uppercase tracking-wider">
                First Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Leo"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-emerald-950/5 border border-emerald-950/10 rounded-2xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-950/15"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-950/70 uppercase tracking-wider">
                Surname *
              </label>
              <input
                type="text"
                placeholder="e.g. Tolstoy"
                value={formData.surname}
                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                className="w-full bg-emerald-950/5 border border-emerald-950/10 rounded-2xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-950/15"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-emerald-950/70 uppercase tracking-wider">
              Author Biography
            </label>
            <textarea
              rows={3}
              placeholder="Tell readers about your literary passions, themes you explore, or poetic style..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-emerald-950/5 border border-emerald-950/10 rounded-2xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-950/15 resize-none placeholder:text-emerald-950/30"
            />
          </div>
        </div>
      )}

      {/* Step 2: Educational Institution & Contact */}
      {currentStep === 2 && (
        <div className="space-y-6 relative z-10 animate-in fade-in duration-200">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-emerald-950/70 uppercase tracking-wider flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-emerald-800" />
              <span>School / College / University *</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Oxford University / St. Xavier's High School"
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              className="w-full bg-emerald-950/5 border border-emerald-950/10 rounded-2xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-950/15"
              required
            />
            <p className="text-[11px] text-emerald-950/40">
              Displayed on your author bio and article header credits.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-emerald-950/70 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-800" />
              <span>Contact Phone Number</span>
            </label>
            <input
              type="tel"
              placeholder="e.g. +1 (555) 019-2834"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-emerald-950/5 border border-emerald-950/10 rounded-2xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-950/15"
            />
            <p className="text-[11px] text-emerald-950/40">
              For editorial communications and account recovery.
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Date of Birth & Age Category */}
      {currentStep === 3 && (
        <div className="space-y-6 relative z-10 animate-in fade-in duration-200">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-emerald-950/70 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-800" />
              <span>Date of Birth *</span>
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full bg-emerald-950/5 border border-emerald-950/10 rounded-2xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-950/15"
              required
            />
          </div>

          {/* Dynamic Age Badge Preview */}
          {computedAge !== null && computedCategory && (
            <div className="p-5 rounded-2xl bg-emerald-950/5 border border-emerald-950/10 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-950/60">
                Live Age Category Preview
              </div>

              <div className="flex items-center gap-3">
                <AgeBadge dateOfBirth={formData.dateOfBirth} age={computedAge} />
                <span className="text-sm font-serif font-bold text-emerald-950">
                  {computedAge} Years Old ({computedCategory.label})
                </span>
              </div>

              <p className="text-xs text-emerald-950/60 leading-relaxed">
                {computedAge <= 18
                  ? "Your articles will feature a youthful author badge highlighting your literary achievements in this bracket."
                  : "Your articles will proudly display your author age badge across Chroma Diaries editions."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Genre Preferences */}
      {currentStep === 4 && (
        <div className="space-y-4 relative z-10 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GENRES.map((genre) => {
              const isSelected = formData.selectedGenres.includes(genre.id);
              const Icon = genre.icon;
              return (
                <button
                  type="button"
                  key={genre.id}
                  onClick={() => toggleGenre(genre.id)}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-emerald-950 text-cream-50 border-emerald-950 shadow-lg shadow-emerald-950/10"
                      : "bg-emerald-950/5 text-emerald-950 border-emerald-950/10 hover:border-emerald-950/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-emerald-800"}`} />
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm mb-0.5">{genre.name}</h4>
                    <p className={`text-[11px] leading-tight ${isSelected ? "text-cream-100/70" : "text-emerald-950/50"}`}>
                      {genre.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-8 border-t border-emerald-950/10 mt-8 relative z-10">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="py-3 px-5 rounded-full border border-emerald-950/15 text-emerald-950 font-bold text-xs uppercase tracking-wider hover:bg-emerald-950/5 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            className="py-3.5 px-8 rounded-full bg-emerald-950 text-cream-50 font-bold text-xs uppercase tracking-widest hover:bg-emerald-900 transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/15 cursor-pointer"
          >
            <span>Next Step</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            disabled={isLoading}
            onClick={handleComplete}
            className="py-3.5 px-8 rounded-full bg-emerald-950 text-cream-50 font-bold text-xs uppercase tracking-widest hover:bg-emerald-900 transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/15 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Complete Onboarding</span>
                <Sparkles className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
