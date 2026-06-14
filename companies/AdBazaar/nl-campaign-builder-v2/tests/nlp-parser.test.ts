import { NLPParserService } from '../src/services/nlp-parser.service';

describe('NLPParserService', () => {
  let parser: NLPParserService;

  beforeEach(() => {
    parser = new NLPParserService();
  });

  describe('parse', () => {
    it('should parse a basic sales campaign request', async () => {
      const input = 'I want to sell 1000 phones in Bangalore';
      const result = await parser.parse(input);

      expect(result).toBeDefined();
      expect(result.parsed).toBeDefined();
      expect(result.parsed.goal.type).toBe('sales');
      expect(result.parsed.goal.target).toBe(1000);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract location from input', async () => {
      const input = 'Run a campaign to sell shoes in Mumbai and Pune';
      const result = await parser.parse(input);

      expect(result.parsed.audience.location).toContain('Mumbai');
      expect(result.parsed.audience.location).toContain('Pune');
    });

    it('should parse budget from input', async () => {
      const input = 'I want to sell products worth 50000 INR in Delhi';
      const result = await parser.parse(input);

      expect(result.parsed.budget.amount).toBe(50000);
      expect(result.parsed.budget.currency).toBe('INR');
    });

    it('should detect lead generation goal', async () => {
      const input = 'Generate 500 leads for my consulting business in Chennai';
      const result = await parser.parse(input);

      expect(result.parsed.goal.type).toBe('leads');
      expect(result.parsed.goal.target).toBe(500);
    });

    it('should detect booking goal', async () => {
      const input = 'Book 100 appointments for our spa services in Hyderabad';
      const result = await parser.parse(input);

      expect(result.parsed.goal.type).toBe('bookings');
    });

    it('should detect traffic goal', async () => {
      const input = 'Drive 10000 visitors to my website in Kolkata';
      const result = await parser.parse(input);

      expect(result.parsed.goal.type).toBe('traffic');
      expect(result.parsed.goal.target).toBe(10000);
    });

    it('should detect awareness goal', async () => {
      const input = 'Increase brand awareness for my new restaurant in Jaipur';
      const result = await parser.parse(input);

      expect(result.parsed.goal.type).toBe('awareness');
    });

    it('should handle timeline extraction', async () => {
      const input = 'I want to sell 500 products in 2 weeks in Bangalore';
      const result = await parser.parse(input);

      expect(result.parsed.goal.timeline).toBeDefined();
      expect(result.parsed.goal.timeline).toContain('2');
    });

    it('should infer channels from goal type', async () => {
      const input = 'Generate leads for my B2B software in Bangalore';
      const result = await parser.parse(input);

      expect(result.parsed.channels).toBeDefined();
      expect(result.parsed.channels.length).toBeGreaterThan(0);
    });

    it('should handle explicit channel mentions', async () => {
      const input = 'Run a Facebook and Instagram campaign to sell products in Delhi';
      const result = await parser.parse(input);

      expect(result.parsed.channels).toContain('facebook');
      expect(result.parsed.channels).toContain('instagram');
    });

    it('should extract product information', async () => {
      const input = 'I want to sell 100 laptops in Bangalore';
      const result = await parser.parse(input);

      expect(result.parsed.products).toBeDefined();
    });

    it('should generate warnings for incomplete inputs', async () => {
      const input = 'Sell products';
      const result = await parser.parse(input);

      expect(result.warnings).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty input gracefully', async () => {
      const input = '';
      const result = await parser.parse(input);

      // Should still return a valid parsed intent with defaults
      expect(result.parsed).toBeDefined();
      expect(result.parsed.goal.type).toBeDefined();
    });

    it('should handle very long input', async () => {
      const input = 'I want to sell 1000 phones in Bangalore with a budget of 50000 rupees targeting young adults aged 25-35 in the premium segment for the next 30 days across Facebook and Google';
      const result = await parser.parse(input);

      expect(result.parsed).toBeDefined();
      expect(result.parsed.goal.target).toBe(1000);
    });

    it('should handle special characters in budget', async () => {
      const input = 'I want to sell products worth ₹50,000 in Mumbai';
      const result = await parser.parse(input);

      expect(result.parsed.budget.amount).toBe(50000);
    });

    it('should handle case insensitivity', async () => {
      const input = 'SELL 500 PRODUCTS IN BANGALORE';
      const result = await parser.parse(input);

      expect(result.parsed.goal.type).toBe('sales');
      expect(result.parsed.goal.target).toBe(500);
    });
  });
});