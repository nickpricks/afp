/** Firestore collection names */
export enum DbCollection {
  Users = 'users',
  Invites = 'invites',
  App = 'app',
  Usernames = 'usernames',
}

/** Firestore subcollection names within a user document */
export enum DbSubcollection {
  Profile = 'profile',
  Body = 'body',
  BodyActivities = 'body_activities',
  BodyConfig = 'body_config',
  BudgetConfig = 'budget_config',
  Expenses = 'expenses',
  Income = 'income',
  Children = 'children',
  Feeds = 'feeds',
  Sleep = 'sleep',
  Growth = 'growth',
  Diapers = 'diapers',
  Elimination = 'elimination',
  Meals = 'meals',
  Needs = 'needs',
  Milestones = 'milestones',
  Notifications = 'notifications',
}

/** Firestore document names */
export enum DbDoc {
  Config = 'config',
  Main = 'main',
}

/** Firestore field names */
export enum DbField {
  AdminUid = 'headminickUid',
  LinkedUid = 'linkedUid',
  UsedAt = 'usedAt',
  Modules = 'modules',
}

/** Builds user base path: `users/{uid}` */
export const userPath = (uid: string): string =>
  `${DbCollection.Users}/${uid}`;

/** Builds child base path: `users/{uid}/children/{childId}` */
export const childPath = (uid: string, childId: string): string =>
  `${DbCollection.Users}/${uid}/${DbSubcollection.Children}/${childId}`;
