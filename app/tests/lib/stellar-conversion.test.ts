import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUSDtoXLMRate, convertUSDtoXLM, convertXLMtoUSD } from '@/lib/stellar';

describe('Stellar Currency Conversion', () => {
  describe('getUSDtoXLMRate', () => {
    it('should return a positive exchange rate', async () => {
      const rate = await getUSDtoXLMRate();
      expect(rate).toBeGreaterThan(0);
    });

    it('should return a reasonable rate (not extreme)', async () => {
      const rate = await getUSDtoXLMRate();
      // XLM rate should be between $0.01 and $10
      expect(rate).toBeGreaterThan(0.01);
      expect(rate).toBeLessThan(10);
    });
  });

  describe('convertUSDtoXLM', () => {
    it('should convert USD to XLM correctly', async () => {
      const usdAmount = 100;
      const xlmAmount = await convertUSDtoXLM(usdAmount);

      // With rate ~0.12, $100 USD should be ~833 XLM
      expect(xlmAmount).toBeGreaterThan(0);
      expect(typeof xlmAmount).toBe('number');
    });

    it('should handle small amounts', async () => {
      const usdAmount = 0.01;
      const xlmAmount = await convertUSDtoXLM(usdAmount);

      expect(xlmAmount).toBeGreaterThan(0);
      expect(xlmAmount).toBeLessThan(1);
    });

    it('should round to 7 decimal places (Stellar precision)', async () => {
      const usdAmount = 1;
      const xlmAmount = await convertUSDtoXLM(usdAmount);

      const decimalPlaces = (xlmAmount.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(7);
    });

    it('should handle zero amount', async () => {
      const xlmAmount = await convertUSDtoXLM(0);
      expect(xlmAmount).toBe(0);
    });

    it('should maintain proportionality', async () => {
      const usd1 = await convertUSDtoXLM(100);
      const usd2 = await convertUSDtoXLM(200);

      // 200 USD should convert to roughly 2x the amount as 100 USD
      const ratio = usd2 / usd1;
      expect(ratio).toBeCloseTo(2, 1); // Allow some rounding difference
    });
  });

  describe('convertXLMtoUSD', () => {
    it('should convert XLM to USD correctly', async () => {
      const xlmAmount = 100;
      const usdAmount = await convertXLMtoUSD(xlmAmount);

      // With rate ~0.12, 100 XLM should be ~$12 USD
      expect(usdAmount).toBeGreaterThan(0);
      expect(typeof usdAmount).toBe('number');
    });

    it('should round to 2 decimal places (USD precision)', async () => {
      const xlmAmount = 1;
      const usdAmount = await convertXLMtoUSD(xlmAmount);

      const decimalPlaces = (usdAmount.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });

    it('should be inverse of USD to XLM conversion', async () => {
      const originalUSD = 100;

      // Convert USD -> XLM -> USD
      const xlm = await convertUSDtoXLM(originalUSD);
      const backToUSD = await convertXLMtoUSD(xlm);

      // Should be roughly equal (allowing for rounding)
      expect(backToUSD).toBeCloseTo(originalUSD, 1);
    });

    it('should handle zero amount', async () => {
      const usdAmount = await convertXLMtoUSD(0);
      expect(usdAmount).toBe(0);
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain approximate value through USD -> XLM -> USD', async () => {
      const amounts = [1, 10, 50, 100, 500];

      for (const originalUSD of amounts) {
        const xlm = await convertUSDtoXLM(originalUSD);
        const finalUSD = await convertXLMtoUSD(xlm);

        // Allow 1% rounding difference
        const percentDiff = Math.abs((finalUSD - originalUSD) / originalUSD);
        expect(percentDiff).toBeLessThan(0.01);
      }
    });

    it('should maintain approximate value through XLM -> USD -> XLM', async () => {
      const amounts = [1, 10, 50, 100, 500];

      for (const originalXLM of amounts) {
        const usd = await convertXLMtoUSD(originalXLM);
        const finalXLM = await convertUSDtoXLM(usd);

        // Allow some rounding difference due to Stellar precision limits
        const diff = Math.abs(finalXLM - originalXLM);
        expect(diff).toBeLessThan(0.0000001); // 7 decimal places
      }
    });
  });
});
