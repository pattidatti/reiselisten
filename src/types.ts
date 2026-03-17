export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

export interface PackingList {
  id: string;
  title: string;
  description: string;
  category: 'General' | 'Trip' | 'Ski' | 'Children' | 'Other';
  isPublic: boolean;
  ownerId: string;
  ownerEmail: string;
  sharedWith: string[]; // uids or emails
  createdAt: any;
}

export interface ListItem {
  id: string;
  text: string;
  isChecked: boolean;
  listId: string;
  createdAt: any;
}
