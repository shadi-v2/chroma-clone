import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export const metadata = {
  title: "Author Onboarding | Chroma Diaries",
  description: "Complete your author profile and literary preferences on Chroma Diaries.",
};

export default async function OnboardingPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/auth?redirect=/onboarding");
  }

  const isSchoolValid = Boolean(user.school && user.school.trim() !== "" && user.school !== "Pending Onboarding");
  const isDobValid = Boolean(user.dateOfBirth);
  const isNameValid = Boolean(user.firstName?.trim() && user.surname?.trim());

  if (user.onboardingCompleted || (isNameValid && isSchoolValid && isDobValid)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4 py-16">
      <OnboardingWizard />
    </div>
  );
}

