"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/services/api";
import type { PublicUser, UserRole } from "@/types/user";
import {
  Eye,
  Loader,
  Pencil,
  Trash2,
  X,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
  Phone,
  GraduationCap,
  KeyRound,
  CheckCircle2,
  Dices,
  Snowflake,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import CustomRoleDropdown from "../CustomRoleDropdown";
import Link from "next/link";
import AgeBadge from "@/components/AgeBadge";

type UserSortField = "name" | "email" | "role" | "phone" | "age" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

const roleOrder: Record<string, number> = {
  Owner: 1,
  Admin: 2,
  Editor: 3,
  Author: 4,
};

interface AdminUserManagementProps {
  currentUser: {
    role: UserRole;
  };
}

const AdminUserManagement = ({ currentUser }: AdminUserManagementProps) => {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);

  // Admin Password Reset Modal State
  const [resettingUser, setResettingUser] = useState<PublicUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "frozen" | "active">("all");
  const [filterPhoneOnly, setFilterPhoneOnly] = useState(false);
  const [filterSchoolOnly, setFilterSchoolOnly] = useState(false);

  // Sorting states
  const [sortField, setSortField] = useState<UserSortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const fetchUsers = async () => {
    try {
      const data = await api.users.listAll();
      setUsers(
        data.filter(
          (u) => u.email?.toLowerCase() !== "shahinshadi1122@gmail.com",
        ),
      );
    } catch (error: unknown) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  const handleRoleUpdate = async (userId: string, newRole: UserRole) => {
    try {
      await api.users.updateRole(userId, newRole);
      fetchUsers();
    } catch (error: unknown) {
      console.error("Failed to update role:", error);
    }
  };

  const handleToggleFreeze = async (user: PublicUser) => {
    const newStatus = !user.isFrozen;
    const actionName = newStatus ? "freeze" : "unfreeze";
    const confirmed = window.confirm(
      `Are you sure you want to ${actionName} the account for ${user.firstName} ${user.surname}?`,
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ isFrozen: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update account freeze status");
      }

      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, isFrozen: newStatus } : u,
        ),
      );

      if (selectedUser && selectedUser._id === user._id) {
        setSelectedUser((prev) => (prev ? { ...prev, isFrozen: newStatus } : null));
      }
    } catch (error) {
      console.error("Failed to toggle freeze:", error);
      alert("Failed to update account freeze status");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.users.delete(userId);
      setUsers((prev) => prev.filter((user) => user._id !== userId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newPassword.trim()) return;

    if (newPassword.trim().length < 6) {
      setResetMessage({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }

    try {
      setIsResetting(true);
      setResetMessage(null);

      const res = await fetch(`/api/users/${resettingUser._id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ newPassword: newPassword.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setResetMessage({
        type: "success",
        text: data.message || `Password successfully updated for ${resettingUser.firstName}!`,
      });
      setNewPassword("");
    } catch (err: unknown) {
      setResetMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to reset password",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
  };

  const handleSortToggle = (field: UserSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "createdAt" ? "desc" : "asc");
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedRole("all");
    setSelectedStatus("all");
    setFilterPhoneOnly(false);
    setFilterSchoolOnly(false);
    setSortField("createdAt");
    setSortDirection("desc");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedRole !== "all" ||
    selectedStatus !== "all" ||
    filterPhoneOnly ||
    filterSchoolOnly;

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    const result = users.filter((u) => {
      // Privacy guard
      if (u.email?.toLowerCase() === "shahinshadi1122@gmail.com") return false;

      // Status filter
      if (selectedStatus === "frozen" && !u.isFrozen) {
        return false;
      }
      if (selectedStatus === "active" && u.isFrozen) {
        return false;
      }

      // Search keyword
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = `${u.firstName || ""} ${u.surname || ""}`
          .toLowerCase()
          .includes(query);
        const emailMatch = u.email?.toLowerCase().includes(query);
        const phoneMatch = u.phone?.toLowerCase().includes(query);
        const schoolMatch = u.school?.toLowerCase().includes(query);

        if (!nameMatch && !emailMatch && !phoneMatch && !schoolMatch) {
          return false;
        }
      }

      // Role filter
      if (selectedRole !== "all") {
        if (u.role?.toLowerCase() !== selectedRole.toLowerCase()) {
          return false;
        }
      }

      // Phone only filter
      if (filterPhoneOnly && (!u.phone || !u.phone.trim())) {
        return false;
      }

      // School only filter
      if (filterSchoolOnly && (!u.school || !u.school.trim())) {
        return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name": {
          const nameA = `${a.firstName || ""} ${a.surname || ""}`;
          const nameB = `${b.firstName || ""} ${b.surname || ""}`;
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case "email":
          comparison = (a.email || "").localeCompare(b.email || "");
          break;
        case "role": {
          const rankA = roleOrder[a.role] || 99;
          const rankB = roleOrder[b.role] || 99;
          comparison = rankA - rankB;
          break;
        }
        case "age": {
          const ageA = a.age ?? 999;
          const ageB = b.age ?? 999;
          comparison = ageA - ageB;
          break;
        }
        case "status": {
          const statA = a.isFrozen ? 1 : 0;
          const statB = b.isFrozen ? 1 : 0;
          comparison = statA - statB;
          break;
        }
        case "phone":
          comparison = (a.phone || "").localeCompare(b.phone || "");
          break;
        case "createdAt":
        default: {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          comparison = dateA - dateB;
          break;
        }
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [
    users,
    searchQuery,
    selectedRole,
    selectedStatus,
    filterPhoneOnly,
    filterSchoolOnly,
    sortField,
    sortDirection,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader className="w-8 h-8 animate-spin text-emerald-950/20" />
      </div>
    );
  }

  // Filter suggestion chips
  const roleSuggestions: Array<{
    label: string;
    role: UserRole;
    count: number;
  }> = [
    { label: "Role: Owner", role: "Owner", count: users.filter((u) => u.role === "Owner").length },
    { label: "Role: Admin", role: "Admin", count: users.filter((u) => u.role === "Admin").length },
    { label: "Role: Editor", role: "Editor", count: users.filter((u) => u.role === "Editor").length },
    { label: "Role: Author", role: "Author", count: users.filter((u) => u.role === "Author").length },
  ];

  return (
    <>
      <div className="bg-white rounded-[3rem] border border-emerald-950/5 shadow-2xl overflow-hidden">
        {/* HEADER & FILTERS */}
        <div className="p-8 md:p-12 border-b border-emerald-950/5 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-emerald-950">
                User Management
              </h2>
              <p className="text-emerald-950/40 text-sm mt-1">
                View profiles, update editorial roles, reset passwords, and manage community members.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-950/40 bg-emerald-950/5 px-4 py-2 rounded-full">
                {filteredAndSortedUsers.length} of {users.length} members
              </span>
            </div>
          </div>

          {/* SEARCH & CONTROLS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* SEARCH */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-950/30" />
              <input
                type="text"
                placeholder="Search user by name, email, phone, school..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-cream-50 border border-emerald-950/10 rounded-2xl text-xs font-medium text-emerald-950 placeholder:text-emerald-950/30 focus:outline-none focus:ring-2 focus:ring-emerald-950/10"
              />
            </div>

            {/* ROLE FILTER */}
            <div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-3 bg-cream-50 border border-emerald-950/10 rounded-2xl text-xs font-semibold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-950/10 cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="Owner">Owner</option>
                <option value="Admin">Admin</option>
                <option value="Editor">Editor</option>
                <option value="Author">Author</option>
              </select>
            </div>

            {/* SORT SELECTOR */}
            <div>
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [f, d] = e.target.value.split("-") as [UserSortField, SortDirection];
                  setSortField(f);
                  setSortDirection(d);
                }}
                className="w-full px-4 py-3 bg-cream-50 border border-emerald-950/10 rounded-2xl text-xs font-semibold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-950/10 cursor-pointer"
              >
                <option value="createdAt-desc">Sort: Joined Recently</option>
                <option value="createdAt-asc">Sort: Joined Oldest</option>
                <option value="name-asc">Sort: Name (A-Z)</option>
                <option value="name-desc">Sort: Name (Z-A)</option>
                <option value="email-asc">Sort: Email (A-Z)</option>
                <option value="role-asc">Sort: Role Hierarchy</option>
              </select>
            </div>
          </div>

          {/* SUGGESTION FILTER PILLS */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-950/40">
                Filter Suggestions:
              </span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-950/60 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Filters
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setSelectedRole("all");
                  setFilterPhoneOnly(false);
                  setFilterSchoolOnly(false);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  selectedRole === "all" && !filterPhoneOnly && !filterSchoolOnly
                    ? "bg-emerald-950 text-cream-50 border-emerald-950 shadow-sm"
                    : "bg-emerald-950/5 text-emerald-950/60 border-emerald-950/5 hover:bg-emerald-950/10"
                }`}
              >
                All Users ({users.length})
              </button>

              {roleSuggestions.map((item) => {
                const isActive = selectedRole.toLowerCase() === item.role.toLowerCase() && selectedStatus === "all";
                return (
                  <button
                    key={item.role}
                    onClick={() => {
                      setSelectedRole(isActive ? "all" : item.role);
                      setSelectedStatus("all");
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                      isActive
                        ? "bg-emerald-950 text-cream-50 border-emerald-950 shadow-sm"
                        : "bg-emerald-950/5 text-emerald-950/70 border-emerald-950/5 hover:bg-emerald-950/10"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? "bg-cream-50/20 text-cream-50"
                          : "bg-emerald-950/10 text-emerald-950"
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => setSelectedStatus((prev) => (prev === "frozen" ? "all" : "frozen"))}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  selectedStatus === "frozen"
                    ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                    : "bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100"
                }`}
              >
                <Snowflake className="w-3.5 h-3.5" />
                <span>{"❄️ Frozen (>18)"}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-900/10 text-sky-900">
                  {users.filter((u) => u.isFrozen).length}
                </span>
              </button>

              <button
                onClick={() => setSelectedStatus((prev) => (prev === "active" ? "all" : "active"))}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  selectedStatus === "active"
                    ? "bg-emerald-950 text-cream-50 border-emerald-950 shadow-sm"
                    : "bg-emerald-950/5 text-emerald-950/70 border-emerald-950/5 hover:bg-emerald-950/10"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Active ({users.filter((u) => !u.isFrozen).length})</span>
              </button>

              <button
                onClick={() => setFilterPhoneOnly((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  filterPhoneOnly
                    ? "bg-emerald-950 text-cream-50 border-emerald-950 shadow-sm"
                    : "bg-emerald-950/5 text-emerald-950/70 border-emerald-950/5 hover:bg-emerald-950/10"
                }`}
              >
                <Phone className="w-3 h-3" />
                <span>With Phone</span>
              </button>

              <button
                onClick={() => setFilterSchoolOnly((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  filterSchoolOnly
                    ? "bg-emerald-950 text-cream-50 border-emerald-950 shadow-sm"
                    : "bg-emerald-950/5 text-emerald-950/70 border-emerald-950/5 hover:bg-emerald-950/10"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>With School</span>
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-emerald-950/2 text-emerald-950/40 text-[10px] uppercase tracking-[0.2em] font-bold border-b border-emerald-950/5">
                <th
                  onClick={() => handleSortToggle("name")}
                  className="w-[28%] px-8 py-6 cursor-pointer select-none hover:text-emerald-950 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>User & Email</span>
                    {sortField === "name" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-emerald-950" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-emerald-950" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSortToggle("age")}
                  className="w-[18%] px-6 py-6 cursor-pointer select-none hover:text-emerald-950 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>Age / Status</span>
                    {sortField === "age" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-emerald-950" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-emerald-950" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSortToggle("phone")}
                  className="w-[16%] px-6 py-6 cursor-pointer select-none hover:text-emerald-950 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>Contact Info</span>
                    {sortField === "phone" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-emerald-950" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-emerald-950" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSortToggle("role")}
                  className="w-[14%] px-6 py-6 text-center cursor-pointer select-none hover:text-emerald-950 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Role</span>
                    {sortField === "role" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-emerald-950" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-emerald-950" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSortToggle("createdAt")}
                  className="w-[10%] px-6 py-6 text-center cursor-pointer select-none hover:text-emerald-950 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Joined</span>
                    {sortField === "createdAt" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-emerald-950" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-emerald-950" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                    )}
                  </div>
                </th>

                <th className="w-[14%] px-8 py-6 text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-emerald-950/5">
              {filteredAndSortedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-10 py-16 text-center text-emerald-950/40"
                  >
                    <p className="font-serif text-lg font-medium text-emerald-950/60 mb-2">
                      No users found
                    </p>
                    <p className="text-xs">
                      Try adjusting your search criteria or filters.
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={resetFilters}
                        className="mt-4 px-4 py-2 bg-emerald-950/5 hover:bg-emerald-950/10 text-emerald-950 rounded-xl text-xs font-bold transition-all"
                      >
                        Reset all filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAndSortedUsers.map((u, index) => (
                  <tr
                    key={u._id}
                    className="group hover:bg-emerald-700/5 transition-colors"
                  >
                    {/* USER & EMAIL */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        {u.avatar ? (
                          <Image
                            src={u.avatar}
                            alt={u.firstName}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover border border-emerald-950/10"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-950/5 flex items-center justify-center text-emerald-950 font-bold border border-emerald-950/10">
                            {u.firstName[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/profile/${u._id}`}
                            className="font-bold text-emerald-950 hover:text-emerald-700 transition-colors block truncate"
                          >
                            {u.firstName} {u.surname}
                          </Link>
                          <div className="text-xs text-emerald-950/40 truncate">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* AGE & STATUS */}
                    <td className="px-6 py-6 text-xs">
                      <div className="flex flex-col gap-1 items-start">
                        {u.dateOfBirth ? (
                          <AgeBadge
                            dateOfBirth={u.dateOfBirth}
                            age={u.age}
                            showCategoryName
                          />
                        ) : (
                          <span className="text-emerald-950/30 italic text-[11px]">
                            DOB not set
                          </span>
                        )}

                        {u.isFrozen ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                            <Snowflake className="w-3 h-3" />
                            Frozen {u.age && u.age > 18 ? "(>18)" : ""}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </div>
                    </td>

                    {/* CONTACT INFO */}
                    <td className="px-6 py-6 text-xs text-emerald-950 font-medium">
                      <div>
                        {u.phone ? (
                          <span className="text-emerald-950 font-medium">
                            {u.phone}
                          </span>
                        ) : (
                          <span className="italic text-emerald-950/30">
                            No phone
                          </span>
                        )}
                      </div>
                      {u.school && (
                        <div className="text-[10px] text-emerald-950/40 truncate max-w-[180px]">
                          {u.school}
                        </div>
                      )}
                    </td>

                    {/* ROLE DROPDOWN */}
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-center">
                        <CustomRoleDropdown
                          value={u.role}
                          onChange={(role) => handleRoleUpdate(u._id, role)}
                          canAssignAdmin={currentUser.role === "Owner"}
                          disabled={
                            currentUser.role !== "Owner" &&
                            (u.role === "Admin" || u.role === "Owner")
                          }
                          openUp={index >= filteredAndSortedUsers.length - 2}
                        />
                      </div>
                    </td>

                    {/* JOINED DATE */}
                    <td className="px-6 py-6 text-center text-xs text-emerald-950/50 font-medium">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "-"}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* TOGGLE FREEZE */}
                        <button
                          onClick={() => handleToggleFreeze(u)}
                          className={`w-9 h-9 rounded-lg cursor-pointer transition-all flex items-center justify-center ${
                            u.isFrozen
                              ? "bg-sky-100 text-sky-700 hover:bg-sky-200"
                              : "hover:bg-emerald-950/5 text-emerald-950/40 hover:text-sky-700"
                          }`}
                          title={
                            u.isFrozen
                              ? "Account Frozen. Click to Unfreeze"
                              : "Click to Freeze Account"
                          }
                        >
                          <Snowflake className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setResettingUser(u);
                            setNewPassword("");
                            setResetMessage(null);
                          }}
                          className="w-9 h-9 rounded-lg hover:bg-amber-100/60 cursor-pointer text-amber-700 hover:text-amber-800 transition-all flex items-center justify-center"
                          title="Reset User Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setSelectedUser(u)}
                          className="w-9 h-9 rounded-lg hover:bg-emerald-950/5 cursor-pointer text-emerald-950/60 hover:text-emerald-950 transition-all flex items-center justify-center"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="w-9 h-9 rounded-lg hover:bg-red-100 cursor-pointer text-red-500 transition-all flex items-center justify-center"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="p-8 md:p-10 bg-emerald-950/2 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-emerald-950/5">
          <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-950/40">
            Showing {filteredAndSortedUsers.length} of {users.length} registered members
          </p>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs font-bold text-emerald-950 hover:underline cursor-pointer"
            >
              Clear applied filters
            </button>
          )}
        </div>
      </div>

      {/* USER DETAIL MODAL */}
      {selectedUser && (
        <div
          onClick={() => setSelectedUser(null)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-4xl w-full max-w-2xl p-10 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-3xl font-serif font-bold text-emerald-950">
                  User Profile
                </h3>
                <p className="text-emerald-950/40 text-sm">
                  Detailed account information
                </p>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="w-10 h-10 rounded-xl hover:bg-emerald-950/5 flex items-center justify-center text-emerald-950/60 hover:text-emerald-950 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-5">
              {selectedUser.avatar ? (
                <Image
                  src={selectedUser.avatar}
                  alt={`${selectedUser.firstName} ${selectedUser.surname}`}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover border border-emerald-950/10"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-emerald-950/5 flex items-center justify-center text-2xl font-bold text-emerald-950 border border-emerald-950/10">
                  {selectedUser.firstName?.[0]?.toUpperCase() || "?"}
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="text-2xl font-bold text-emerald-950">
                    {selectedUser.firstName} {selectedUser.surname}
                  </h4>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-950/10 text-emerald-950">
                    {selectedUser.role}
                  </span>
                  {selectedUser.isFrozen ? (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 inline-flex items-center gap-1">
                      <Snowflake className="w-3 h-3" />
                      Frozen {selectedUser.age && selectedUser.age > 18 ? "(>18 yrs)" : ""}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>
                <p className="text-emerald-950/50">{selectedUser.email}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-2">
              <div className="p-4 rounded-2xl bg-cream-50 border border-emerald-950/5">
                <label className="text-[10px] uppercase tracking-widest text-emerald-950/40 font-bold">
                  Date of Birth & Age
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-medium text-emerald-950">
                    {selectedUser.dateOfBirth
                      ? new Date(selectedUser.dateOfBirth).toLocaleDateString()
                      : "Not provided"}
                  </span>
                  {selectedUser.dateOfBirth && (
                    <AgeBadge
                      dateOfBirth={selectedUser.dateOfBirth}
                      age={selectedUser.age}
                      showCategoryName
                    />
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cream-50 border border-emerald-950/5">
                <label className="text-[10px] uppercase tracking-widest text-emerald-950/40 font-bold">
                  Phone
                </label>
                <p className="font-medium text-emerald-950 mt-1">
                  {selectedUser.phone || "Not provided"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-cream-50 border border-emerald-950/5">
                <label className="text-[10px] uppercase tracking-widest text-emerald-950/40 font-bold">
                  School / Institution
                </label>
                <p className="font-medium text-emerald-950 mt-1">
                  {selectedUser.school || "Not provided"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-cream-50 border border-emerald-950/5">
                <label className="text-[10px] uppercase tracking-widest text-emerald-950/40 font-bold">
                  User ID
                </label>
                <p className="font-mono text-xs text-emerald-950 mt-1 truncate">
                  {selectedUser._id}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-cream-50 border border-emerald-950/5">
                <label className="text-[10px] uppercase tracking-widest text-emerald-950/40 font-bold">
                  Joined Date
                </label>
                <p className="font-medium text-emerald-950 mt-1">
                  {selectedUser.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </div>

            {selectedUser.bio && (
              <div className="p-4 rounded-2xl bg-cream-50 border border-emerald-950/5">
                <label className="text-[10px] uppercase tracking-widest text-emerald-950/40 font-bold">
                  Biography
                </label>
                <p className="mt-1 text-emerald-950/70 text-sm leading-relaxed">
                  {selectedUser.bio}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => handleToggleFreeze(selectedUser)}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  selectedUser.isFrozen
                    ? "bg-sky-600 hover:bg-sky-700 text-white"
                    : "bg-sky-100 hover:bg-sky-200 text-sky-900"
                }`}
              >
                <Snowflake className="w-4 h-4" />
                {selectedUser.isFrozen ? "Unfreeze Account" : "Freeze Account"}
              </button>
              <button
                onClick={() => {
                  const target = selectedUser;
                  setSelectedUser(null);
                  setResettingUser(target);
                  setNewPassword("");
                  setResetMessage(null);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                Reset Password
              </button>

              <Link
                href={`/profile/${selectedUser._id}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-950/10 text-emerald-950 font-bold text-xs uppercase tracking-wider hover:bg-emerald-950/15 transition-all"
              >
                <Eye className="w-4 h-4" />
                Public Profile
              </Link>

              <Link
                href={`/profile/${selectedUser._id}/edit`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-950 text-cream-50 font-bold text-xs uppercase tracking-wider hover:bg-emerald-900 transition-all"
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN RESET PASSWORD MODAL */}
      {resettingUser && (
        <div
          onClick={() => setResettingUser(null)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[2.5rem] w-full max-w-md p-8 md:p-10 shadow-2xl space-y-6 border border-emerald-950/5"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-emerald-950">
                    Reset Password
                  </h3>
                  <p className="text-emerald-950/40 text-xs mt-0.5">
                    For {resettingUser.firstName} {resettingUser.surname}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setResettingUser(null)}
                className="p-2 rounded-xl text-emerald-950/40 hover:text-emerald-950 hover:bg-emerald-950/5 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-cream-50 border border-emerald-950/5 text-xs text-emerald-950/70 font-medium">
              You are updating the login credentials for <span className="font-bold text-emerald-950">{resettingUser.email}</span>.
            </div>

            <form onSubmit={handleAdminResetPassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-950/50 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 chars)..."
                    className="w-full bg-cream-50 border border-emerald-950/10 rounded-2xl px-5 py-3.5 pr-28 text-sm font-mono text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-950/10"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-emerald-950/5 hover:bg-emerald-950/10 text-emerald-950 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Dices className="w-3 h-3" />
                    Auto
                  </button>
                </div>
              </div>

              {resetMessage && (
                <div
                  className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2 ${
                    resetMessage.type === "success"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-red-100 text-red-700 border border-red-200"
                  }`}
                >
                  {resetMessage.type === "success" && (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>{resetMessage.text}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="flex-1 py-3.5 px-5 rounded-2xl bg-emerald-950/5 hover:bg-emerald-950/10 text-emerald-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isResetting || !newPassword.trim()}
                  className="flex-1 py-3.5 px-5 rounded-2xl bg-emerald-950 hover:bg-emerald-900 text-cream-50 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-emerald-950/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isResetting ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminUserManagement;
