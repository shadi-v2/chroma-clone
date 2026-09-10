export interface AgeCategoryInfo {
  age: number;
  label: string;
  categoryName: string;
  badgeClass: string;
  dotColor: string;
}

/**
 * Calculates a person's age from their date of birth
 */
export function calculateAge(
  dateOfBirth: string | Date | null | undefined,
): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age >= 0 && age < 150 ? age : null;
}

/**
 * Returns age category and styling badge color
 * Categories:
 * - Kids (< 13 yrs): Teal
 * - Junior (13-15 yrs): Sky Blue
 * - Senior / Youth (16-18 yrs): Amber / Gold
 * - Young Adult (19-24 yrs): Indigo / Purple
 * - Adult / Master (25+ yrs): Rose / Crimson
 */
export function getAgeCategory(
  ageOrDob: number | string | Date | null | undefined,
): AgeCategoryInfo | null {
  let age: number | null = null;
  if (typeof ageOrDob === "number") {
    age = ageOrDob;
  } else if (ageOrDob) {
    age = calculateAge(ageOrDob);
  }

  if (age === null || age === undefined || isNaN(age)) return null;

  if (age < 13) {
    return {
      age,
      label: `${age} yrs`,
      categoryName: "Kids",
      badgeClass:
        "bg-teal-50 text-teal-700 border-teal-200/80 hover:bg-teal-100",
      dotColor: "bg-teal-500",
    };
  }
  if (age <= 15) {
    return {
      age,
      label: `${age} yrs`,
      categoryName: "Junior",
      badgeClass:
        "bg-sky-50 text-sky-700 border-sky-200/80 hover:bg-sky-100",
      dotColor: "bg-sky-500",
    };
  }
  if (age <= 18) {
    return {
      age,
      label: `${age} yrs`,
      categoryName: "Senior",
      badgeClass:
        "bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100",
      dotColor: "bg-amber-500",
    };
  }
  if (age <= 24) {
    return {
      age,
      label: `${age} yrs`,
      categoryName: "Youth",
      badgeClass:
        "bg-indigo-50 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100",
      dotColor: "bg-indigo-500",
    };
  }
  return {
    age,
    label: `${age} yrs`,
    categoryName: "Adult",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100",
    dotColor: "bg-rose-500",
  };
}

/**
 * Determines whether an account is frozen.
 * Chroma Diaries is a magazine for youth / writers up to 18 years of age.
 * - Authors who are > 18 years old are restricted/frozen.
 * - Authors who are <= 18 years old are FREE (unfrozen and active).
 * - Site owners, Admins, and Editors are never locked out by age.
 */
export function isUserFrozen(user: {
  isFrozen?: boolean | null;
  is_frozen?: boolean | null;
  dateOfBirth?: string | Date | null;
  date_of_birth?: string | Date | null;
  role?: string;
  email?: string;
}): boolean {
  if (
    user.role === "Owner" ||
    user.role === "Admin" ||
    user.role === "Editor" ||
    user.email?.toLowerCase() === "shahinshadi1122@gmail.com"
  ) {
    return Boolean(user.isFrozen === true || user.is_frozen === true);
  }

  if (user.isFrozen === true || user.is_frozen === true) {
    return true;
  }

  const dob = user.dateOfBirth || user.date_of_birth;
  const age = calculateAge(dob);
  // Only users older than 18 are frozen (restricted under-18 magazine policy)
  if (age !== null && age > 18) {
    return true;
  }

  return false;
}
