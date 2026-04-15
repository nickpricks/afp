import { describe, expect, it } from 'vitest';

import { DbCollection, DbSubcollection, DbDoc, DbField, userPath } from '@/constants/db';

describe('DbCollection', () => {
  it('has Users, Invites, App, Usernames', () => {
    expect(DbCollection.Users).toBe('users');
    expect(DbCollection.Invites).toBe('invites');
    expect(DbCollection.App).toBe('app');
    expect(DbCollection.Usernames).toBe('usernames');
  });

  it('has exactly 4 collections', () => {
    expect(Object.keys(DbCollection)).toHaveLength(4);
  });
});

describe('DbSubcollection', () => {
  it('has all Phase 2 subcollections', () => {
    expect(DbSubcollection.Profile).toBe('profile');
    expect(DbSubcollection.Body).toBe('body');
    expect(DbSubcollection.BodyActivities).toBe('body_activities');
    expect(DbSubcollection.BodyConfig).toBe('body_config');
    expect(DbSubcollection.BudgetConfig).toBe('budget_config');
    expect(DbSubcollection.Expenses).toBe('expenses');
    expect(DbSubcollection.Income).toBe('income');
    expect(DbSubcollection.Children).toBe('children');
    expect(DbSubcollection.Feeds).toBe('feeds');
    expect(DbSubcollection.Sleep).toBe('sleep');
    expect(DbSubcollection.Growth).toBe('growth');
    expect(DbSubcollection.Diapers).toBe('diapers');
    expect(DbSubcollection.Elimination).toBe('elimination');
    expect(DbSubcollection.Meals).toBe('meals');
  });

  it('has exactly 15 subcollections', () => {
    expect(Object.keys(DbSubcollection)).toHaveLength(15);
  });

  it('no longer has old BabyFeeds/BabySleep/BabyGrowth/BabyDiapers', () => {
    const keys = Object.keys(DbSubcollection);
    expect(keys).not.toContain('BabyFeeds');
    expect(keys).not.toContain('BabySleep');
    expect(keys).not.toContain('BabyGrowth');
    expect(keys).not.toContain('BabyDiapers');
  });
});

describe('DbDoc', () => {
  it('has Config and Main', () => {
    expect(DbDoc.Config).toBe('config');
    expect(DbDoc.Main).toBe('main');
  });
});

describe('DbField', () => {
  it('has AdminUid, LinkedUid, UsedAt, Modules', () => {
    expect(DbField.AdminUid).toBe('headminickUid');
    expect(DbField.LinkedUid).toBe('linkedUid');
    expect(DbField.UsedAt).toBe('usedAt');
    expect(DbField.Modules).toBe('modules');
  });
});

describe('userPath', () => {
  it('builds users/{uid} path', () => {
    expect(userPath('abc123')).toBe('users/abc123');
  });
});
