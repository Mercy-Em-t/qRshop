import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getShop, getShopBySubdomain } from './shop-service';
import { supabase } from './supabase-client';

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

describe('shop-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches a shop by ID successfully', async () => {
    const mockShop = { id: 'shop-123', name: 'Test Shop' };
    const mockSingle = vi.fn().mockResolvedValue({ data: mockShop, error: null });
    
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle
        }))
      }))
    });

    const result = await getShop('shop-123');
    expect(result).toEqual(mockShop);
    expect(supabase.from).toHaveBeenCalledWith('shops');
  });

  it('returns null if shop fetching fails', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
    
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle
        }))
      }))
    });

    const result = await getShop('invalid-id');
    expect(result).toBeNull();
  });

  it('fetches a shop by subdomain successfully', async () => {
    const mockShop = { id: 'shop-123', subdomain: 'test', name: 'Test Shop' };
    const mockSingle = vi.fn().mockResolvedValue({ data: mockShop, error: null });
    
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle
        }))
      }))
    });

    const result = await getShopBySubdomain('test');
    expect(result).toEqual(mockShop);
  });
});
