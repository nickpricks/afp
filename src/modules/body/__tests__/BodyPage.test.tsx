import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { BodyPage } from '@/modules/body/components/BodyPage';
import type { BodyConfig } from '@/modules/body/types';

const mockConfig: BodyConfig = {
  floors: true,
  walking: true,
  running: false,
  cycling: false,
  yoga: false,
  floorHeight: 3.0,
  configuredAt: '2026-04-07T00:00:00Z',
};

const mockSaveConfig = vi.fn();

vi.mock('@/modules/body/hooks/useBodyConfig', () => ({
  useBodyConfig: () => ({
    config: mockConfig,
    isConfigured: true,
    loading: false,
    saveConfig: mockSaveConfig,
  }),
}));

const mockTodayRecord = {
  dateStr: '2026-04-07',
  up: 0,
  down: 0,
  walkMeters: 0,
  runMeters: 0,
  total: 0,
  updatedAt: '2026-04-07T00:00:00Z',
};

vi.mock('@/modules/body/hooks/useBodyData', () => ({
  useBodyData: () => ({
    records: [],
    todayRecord: mockTodayRecord,
    activities: [],
    tap: vi.fn(),
    logActivity: vi.fn(),
    saveRecord: vi.fn(),
    updateActivity: vi.fn(),
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

describe('BodyPage — reconfigure', () => {
  it('shows a settings/gear button when configured', () => {
    render(<BodyPage />);
    expect(screen.getByRole('button', { name: /settings|configure|gear/i })).toBeInTheDocument();
  });

  it('clicking gear button shows the config form', () => {
    render(<BodyPage />);
    fireEvent.click(screen.getByRole('button', { name: /settings|configure|gear/i }));
    expect(screen.getByText('Configure Body Tracking')).toBeInTheDocument();
  });

  it('config form is pre-filled with current config', () => {
    render(<BodyPage />);
    fireEvent.click(screen.getByRole('button', { name: /settings|configure|gear/i }));
    // Floors and Walking should be checked (from mockConfig)
    const floorsCheckbox = screen.getByRole('checkbox', { name: /floors/i });
    expect(floorsCheckbox).toBeChecked();
    const walkingCheckbox = screen.getByRole('checkbox', { name: /walking/i });
    expect(walkingCheckbox).toBeChecked();
  });
});
