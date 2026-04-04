/** Firestore collection names */
export enum DbCollection {
  Users = 'users',
  Invites = 'invites',
  App = 'app',
}

/** Firestore subcollection names within a user document */
export enum DbSubcollection {
  Profile = 'profile',
  Body = 'body',
  Expenses = 'expenses',
  BabyFeeds = 'baby_feeds',
  BabySleep = 'baby_sleep',
  BabyGrowth = 'baby_growth',
  BabyDiapers = 'baby_diapers',
}

/** Firestore document names */
export enum DbDoc {
  Config = 'config',
  Main = 'main',
}

/** Firestore field names */
export enum DbField {
  HeadminickUid = 'headminickUid',
  LinkedUid = 'linkedUid',
  UsedAt = 'usedAt',
  Modules = 'modules',
}

/** Builds user base path: `users/{uid}` */
export const userPath = (uid: string): string =>
  `${DbCollection.Users}/${uid}`;

