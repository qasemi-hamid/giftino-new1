export type Language = "fa" | "en";

export interface UserProfile {
  name: string;
  phone: string;
  isLoggedIn: boolean;
  avatar?: string;
  isDemo?: boolean;
  uid?: string;
  email?: string;
  bio?: string;
  birthday?: string;
  isAdvisor?: boolean;
  advisorCategory?: string;
  advisorBio?: string;
  advisorBadge?: string;
  advisorMetrics?: {
    followersCount: number;
    guidesCount: number;
    savedCount: number;
    matchRate: number;
  };
}

export interface Contributor {
  name: string;
  amount: number;
  isPaid: boolean;
  refNumber?: string;
}

export interface GroupGiftInfo {
  coordinatorName: string;
  coordinatorCard: string;
  coordinatorBank: string;
  coordinatorAccount: string;
  targetAmount: number;
  collectedAmount: number;
  contributors: Contributor[];
}

export interface WishlistItem {
  id: string;
  title: string;
  price?: number; // in Tomans or currency
  link?: string;
  notes?: string;
  priority: "high" | "medium" | "low";
  reservedBy?: string; // Name of friend who reserved it (kept secret in surprise mode)
  isReserved: boolean;
  isSecret?: boolean; // added by a friend as a surprise
  addedBy?: string; // friend who suggested/added it
  reservationDate?: string; // YYYY-MM-DD format of reservation
  isPurchased?: boolean; // Whether the claimer has actually purchased it
  purchaseRefNumber?: string; // Delivery tracking or receipt reference
  isGroupGift?: boolean; // Whether this is a group/collaborative gift
  groupGiftInfo?: GroupGiftInfo;
  isExtended?: boolean; // Whether the reservation lock was extended by 48h
}

export interface Wishlist {
  id: string;
  title: string;
  occasionDate: string; // YYYY-MM-DD
  occasionType: "birthday" | "wedding" | "graduation" | "yalda" | "nowruz" | "other";
  items: WishlistItem[];
}

export interface AIGiftRequest {
  ageGroup: string;
  gender: string;
  relation: string;
  budget: string;
  interests: string;
}
