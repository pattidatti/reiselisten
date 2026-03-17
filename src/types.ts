import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  username: string;
  bio: string;
  isProfilePublic: boolean;
  followerCount: number;
  followingCount: number;
  publicListCount: number;
  searchTerms: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UsernameDoc {
  uid: string;
  createdAt: Timestamp;
}

export interface PackingList {
  id: string;
  title: string;
  description: string;
  category: 'General' | 'Trip' | 'Ski' | 'Children' | 'Other';
  isPublic: boolean;
  ownerId: string;
  ownerEmail: string;
  ownerUsername: string;
  ownerDisplayName: string;
  sharedWith: string[];
  shareToken: string | null;
  starCount: number;
  copiedFrom: string | null;
  itemCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ListItem {
  id: string;
  text: string;
  isChecked: boolean;
  listId: string;
  createdAt: Timestamp;
}

export interface Follow {
  followerUid: string;
  followedUid: string;
  followerUsername: string;
  followedUsername: string;
  createdAt: Timestamp;
}

export interface Star {
  uid: string;
  listId: string;
  listTitle: string;
  listOwnerId: string;
  createdAt: Timestamp;
}

export interface ShareToken {
  listId: string;
  createdBy: string;
  createdAt: Timestamp;
}
