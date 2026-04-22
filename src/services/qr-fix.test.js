import { describe, it, expect, vi } from 'vitest';
import { getQrNode } from './qr-node-service';
import { supabase } from './supabase-client';

// Mock supabase client
vi.mock('./supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

describe('QR Node Normalization', () => {
  it('should normalize action and location from legacy action_type', async () => {
    const mockLegacyData = {
      qr_id: 'ABC123',
      action_type: 'open_order',
      shop_id: 'shop-uuid'
      // location and action are missing
    };

    // Setup mock return value
    const mockSingle = vi.fn().mockResolvedValue({ data: mockLegacyData, error: null });
    supabase.from().select().eq().single = mockSingle;

    const result = await getQrNode('ABC123');

    expect(result.action).toBe('open_order');
    expect(result.location).toBe('Unknown Location');
    expect(result.qr_id).toBe('ABC123');
    expect(result.id).toBe('ABC123');
  });

  it('should prefer new action over legacy action_type', async () => {
    const mockData = {
      qr_id: 'XYZ789',
      action: 'open_campaign',
      action_type: 'open_menu',
      location: 'Front Desk'
    };

    const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });
    supabase.from().select().eq().single = mockSingle;

    const result = await getQrNode('XYZ789');

    expect(result.action).toBe('open_campaign');
    expect(result.location).toBe('Front Desk');
  });

  it('should fallback to open_menu and Unknown Location if everything is missing', async () => {
    const mockData = {
      qr_id: 'EMPTY1'
    };

    const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });
    supabase.from().select().eq().single = mockSingle;

    const result = await getQrNode('EMPTY1');

    expect(result.action).toBe('open_menu');
    expect(result.location).toBe('Unknown Location');
  });
});
