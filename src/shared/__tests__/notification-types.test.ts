import { describe, expect, it } from 'vitest';
import { NotificationType, AlertType, Severity, type Notification, ModuleId } from '@/shared/types';

describe('Notification types', () => {
  it('NotificationType has correct values', () => {
    expect(NotificationType.ModuleRequest).toBe('module_request');
    expect(NotificationType.AdminAlert).toBe('admin_alert');
  });

  it('AlertType has correct values', () => {
    expect(AlertType.Alert).toBe('alert');
    expect(AlertType.Notice).toBe('notice');
  });

  it('Severity has correct values', () => {
    expect(Severity.Info).toBe('info');
    expect(Severity.Warning).toBe('warning');
    expect(Severity.Critical).toBe('critical');
  });

  it('Notification interface accepts module request shape', () => {
    const notif: Notification = {
      id: 'test-1',
      type: NotificationType.ModuleRequest,
      moduleId: ModuleId.Body,
      requestedBy: 'uid-123',
      requestedByName: 'Priya',
      createdAt: '2026-04-14T10:00:00Z',
      read: false,
      dismissed: false,
    };
    expect(notif.type).toBe(NotificationType.ModuleRequest);
    expect(notif.moduleId).toBe(ModuleId.Body);
  });

  it('Notification interface accepts admin alert shape', () => {
    const notif: Notification = {
      id: 'test-2',
      type: NotificationType.AdminAlert,
      message: 'Scheduled maintenance tonight',
      severity: Severity.Info,
      alertType: AlertType.Notice,
      shownTillDate: '2026-04-15',
      createdAt: '2026-04-14T10:00:00Z',
      read: false,
      dismissed: false,
    };
    expect(notif.type).toBe(NotificationType.AdminAlert);
    expect(notif.alertType).toBe(AlertType.Notice);
  });
});
