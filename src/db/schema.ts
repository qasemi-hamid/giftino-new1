import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID or Custom unique string
  name: text("name").notNull(),
  phone: text("phone"),
  avatar: text("avatar"),
  email: text("email"),
  isDemo: boolean("is_demo").default(false).notNull(),
  claimedItems: jsonb("claimed_items"), // Store user's claims on other lists
  followingFriendIds: jsonb("following_friend_ids"), // Store followed friend IDs
  createdAt: timestamp("created_at").defaultNow(),
});

// Wishlists table
export const wishlists = pgTable("wishlists", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  occasionDate: text("occasion_date").notNull(),
  occasionType: text("occasion_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Wishlist Items table
export const wishlistItems = pgTable("wishlist_items", {
  id: text("id").primaryKey(),
  wishlistId: text("wishlist_id")
    .references(() => wishlists.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  price: integer("price"),
  link: text("link"),
  notes: text("notes"),
  priority: text("priority").notNull(), // 'high' | 'medium' | 'low'
  isReserved: boolean("is_reserved").default(false).notNull(),
  reservedBy: text("reserved_by"),
  isSecret: boolean("is_secret").default(false).notNull(),
  addedBy: text("added_by"),
  reservationDate: text("reservation_date"),
  isPurchased: boolean("is_purchased").default(false).notNull(),
  purchaseRefNumber: text("purchase_ref_number"),
  isGroupGift: boolean("is_group_gift").default(false).notNull(),
  groupGiftInfo: jsonb("group_gift_info"), // Stores coordinator details and list of contributors
  isExtended: boolean("is_extended").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Friends (Following) table
export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  friendId: text("friend_id").notNull(), // UID of the followed friend
  createdAt: timestamp("created_at").defaultNow(),
});

// Define Relationships
export const usersRelations = relations(users, ({ many }) => ({
  wishlists: many(wishlists),
  friends: many(friends),
}));

export const wishlistsRelations = relations(wishlists, ({ one, many }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  items: many(wishlistItems),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  wishlist: one(wishlists, {
    fields: [wishlistItems.wishlistId],
    references: [wishlists.id],
  }),
}));

export const friendsRelations = relations(friends, ({ one }) => ({
  user: one(users, {
    fields: [friends.userId],
    references: [users.id],
  }),
}));
