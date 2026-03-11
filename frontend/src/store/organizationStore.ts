/**
 * organizationStore — Organization-domain state only.
 *
 * Completely separate from authStore.  No User auth logic here.
 *
 * Persistence strategy
 * ─────────────────────
 * • The active org ID is persisted so we can restore context across page
 *   reloads without an extra API call.
 * • Full org objects are always fetched fresh from the API — only the ID is
 *   cached.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ── Types ─────────────────────────────────────────────────────────────────────

export type OrgRole = 'owner' | 'admin' | 'member';

export interface OrgRead {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface OrgMemberRead {
  user_id: string;
  email: string;
  full_name: string | null;
  role: OrgRole;
  joined_at: string;
}

// ── Store state / actions ─────────────────────────────────────────────────────

export interface OrganizationState {
  /** The organization the user is currently operating within. */
  activeOrg: OrgRead | null;
  /** The caller's role inside activeOrg. */
  activeRole: OrgRole | null;
  /** All organizations the user belongs to. */
  orgs: OrgRead[];
  isLoadingOrgs: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Set the active org and the caller's role within it. */
  setActiveOrg: (org: OrgRead, role: OrgRole) => void;
  /** Replace the full list of orgs (from /organizations). */
  setOrgs: (orgs: OrgRead[]) => void;
  setLoadingOrgs: (loading: boolean) => void;

  /**
   * Clear org context — call this on logout so stale org data is not kept
   * for the next user who might log in on the same device.
   */
  clearOrgs: () => void;

  // ── RBAC helpers ───────────────────────────────────────────────────────────

  /** True if the caller has at least the given role in the active org. */
  hasMinRole: (required: OrgRole) => boolean;
  isOwner: () => boolean;
  isAdmin: () => boolean;
}

const ROLE_LEVELS: Record<OrgRole, number> = { owner: 3, admin: 2, member: 1 };

// ── Store ─────────────────────────────────────────────────────────────────────

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set, get) => ({
      activeOrg: null,
      activeRole: null,
      orgs: [],
      isLoadingOrgs: false,

      setActiveOrg: (org, role) => set({ activeOrg: org, activeRole: role }),

      setOrgs: (orgs) => set({ orgs }),

      setLoadingOrgs: (loading) => set({ isLoadingOrgs: loading }),

      clearOrgs: () =>
        set({ activeOrg: null, activeRole: null, orgs: [], isLoadingOrgs: false }),

      hasMinRole: (required) => {
        const { activeRole } = get();
        if (!activeRole) return false;
        return ROLE_LEVELS[activeRole] >= ROLE_LEVELS[required];
      },

      isOwner: () => get().activeRole === 'owner',
      isAdmin: () => {
        const { activeRole } = get();
        return activeRole === 'owner' || activeRole === 'admin';
      },
    }),

    {
      name: 'chronos-org',
      storage: createJSONStorage(() => localStorage),
      // Persist only the active org ID and role — full objects are refetched.
      partialize: (state) => ({
        activeOrg: state.activeOrg,
        activeRole: state.activeRole,
      }),
    },
  ),
);
