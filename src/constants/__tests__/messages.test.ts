import { describe, expect, it } from 'vitest';

import { BudgetMsg, BodyMsg, BabyMsg, ValidationMsg, InviteMsg, ProviderMsg } from '@/constants/messages';

describe('BudgetMsg', () => {
  it('has expense and income messages', () => {
    expect(BudgetMsg.ExpenseAdded).toBe('Expense added');
    expect(BudgetMsg.ExpenseDeleted).toBe('Expense deleted');
    expect(BudgetMsg.IncomeAdded).toBe('Income added');
    expect(BudgetMsg.IncomeDeleted).toBe('Income deleted');
  });
});

describe('BodyMsg', () => {
  it('has activity, floors, and config messages', () => {
    expect(BodyMsg.ActivityAdded).toBe('Activity logged');
    expect(BodyMsg.ActivityDeleted).toBe('Activity deleted');
    expect(BodyMsg.FloorsUpdated).toBe('Floors updated');
    expect(BodyMsg.ConfigSaved).toBe('Body config saved');
  });
});

describe('BabyMsg', () => {
  it('has messages for all baby subcollections', () => {
    expect(BabyMsg.FeedAdded).toBe('Feed logged');
    expect(BabyMsg.SleepAdded).toBe('Sleep logged');
    expect(BabyMsg.GrowthAdded).toBe('Growth recorded');
    expect(BabyMsg.DiaperAdded).toBe('Diaper logged');
    expect(BabyMsg.ChildAdded).toBe('Child added');
  });
});

describe('ValidationMsg', () => {
  it('has existing validation messages', () => {
    expect(ValidationMsg.DateRequired).toBeDefined();
    expect(ValidationMsg.AmountPositive).toBeDefined();
  });
});

describe('InviteMsg', () => {
  it('has existing invite messages', () => {
    expect(InviteMsg.Created).toBeDefined();
    expect(InviteMsg.NotFound).toBeDefined();
    expect(InviteMsg.AlreadyUsed).toBeDefined();
  });
});

describe('ProviderMsg', () => {
  it('has context guard messages', () => {
    expect(ProviderMsg.AuthRequired).toBeDefined();
    expect(ProviderMsg.ToastRequired).toBeDefined();
  });
});
