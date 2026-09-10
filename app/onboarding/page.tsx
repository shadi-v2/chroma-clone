import React from "react";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export const metadata = {
  title: "Author Onboarding | Chroma Diaries",
  description: "Complete your author profile and literary preferences on Chroma Diaries.",
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4 py-16">
      <OnboardingWizard />
    </div>
  );
}
