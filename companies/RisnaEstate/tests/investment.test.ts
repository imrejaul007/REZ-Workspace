/**
 * RisnaEstate - Investment Calculator Tests
 */

describe('EMI Calculator', () => {
  function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
    const monthlyRate = annualRate / 12 / 100;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) /
                 (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return Math.round(emi);
  }

  test('calculates EMI correctly', () => {
    const emi = calculateEMI(2500000, 8.5, 240); // 20 years
    expect(emi).toBeGreaterThan(0);
    expect(emi).toBeLessThan(2500000); // EMI should be less than principal
  });

  test('EMI increases with rate', () => {
    const lowRate = calculateEMI(2500000, 7, 240);
    const highRate = calculateEMI(2500000, 10, 240);
    expect(highRate).toBeGreaterThan(lowRate);
  });

  test('EMI increases with principal', () => {
    const smallLoan = calculateEMI(1000000, 8.5, 240);
    const largeLoan = calculateEMI(5000000, 8.5, 240);
    expect(largeLoan).toBeGreaterThan(smallLoan);
  });

  test('EMI decreases with longer tenure', () => {
    const short = calculateEMI(2500000, 8.5, 120); // 10 years
    const long = calculateEMI(2500000, 8.5, 360); // 30 years
    expect(long).toBeLessThan(short);
  });
});

describe('ROI Calculator', () => {
  function calculateROI(purchasePrice: number, monthlyRent: number, years: number, appreciationRate: number): {
    totalRent: number;
    appreciation: number;
    totalReturn: number;
    roi: number;
    yearlyROI: number;
  } {
    const totalRent = monthlyRent * 12 * years;
    const appreciation = purchasePrice * (Math.pow(1 + appreciationRate / 100, years) - 1);
    const totalReturn = totalRent + appreciation;
    const roi = (totalReturn / purchasePrice) * 100;
    const yearlyROI = roi / years;

    return { totalRent, appreciation, totalReturn, roi, yearlyROI };
  }

  test('calculates rental yield', () => {
    const result = calculateROI(2500000, 15000, 5, 8);
    expect(result.totalRent).toBe(15000 * 12 * 5);
  });

  test('calculates appreciation', () => {
    const result = calculateROI(2500000, 15000, 5, 8);
    // 5 years at 8% = 1.08^5 - 1 = 46.93%
    expect(result.appreciation).toBeGreaterThan(0);
  });

  test('calculates total return', () => {
    const result = calculateROI(2500000, 15000, 5, 8);
    expect(result.totalReturn).toBe(result.totalRent + result.appreciation);
  });

  test('calculates yearly ROI', () => {
    const result = calculateROI(2500000, 15000, 5, 8);
    expect(result.yearlyROI).toBe(result.roi / 5);
  });
});

describe('Golden Visa Eligibility', () => {
  function checkGoldenVisaEligible(amount: number, currency: string): {
    eligible: boolean;
    program: string;
    validity: string;
  } {
    if (currency === 'AED') {
      if (amount >= 2000000) {
        return { eligible: true, program: 'Golden Visa', validity: '10 years' };
      } else if (amount >= 545000) {
        return { eligible: true, program: 'Investor Visa', validity: '3 years' };
      }
    } else if (currency === 'INR') {
      if (amount >= 45000000) {
        return { eligible: true, program: 'Golden Visa', validity: '10 years' };
      }
    }
    return { eligible: false, program: '', validity: '' };
  }

  test('eligible for Golden Visa at 2M AED', () => {
    const result = checkGoldenVisaEligible(2000000, 'AED');
    expect(result.eligible).toBe(true);
    expect(result.program).toBe('Golden Visa');
  });

  test('eligible for Investor Visa at 545K AED', () => {
    const result = checkGoldenVisaEligible(545000, 'AED');
    expect(result.eligible).toBe(true);
    expect(result.program).toBe('Investor Visa');
  });

  test('not eligible below 545K AED', () => {
    const result = checkGoldenVisaEligible(500000, 'AED');
    expect(result.eligible).toBe(false);
  });

  test('eligible for Golden Visa at 4.5Cr INR', () => {
    const result = checkGoldenVisaEligible(45000000, 'INR');
    expect(result.eligible).toBe(true);
    expect(result.program).toBe('Golden Visa');
  });
});

describe('Rental Yield Calculator', () => {
  function calculateRentalYield(propertyValue: number, monthlyRent: number): number {
    const annualRent = monthlyRent * 12;
    return (annualRent / propertyValue) * 100;
  }

  test('calculates gross rental yield', () => {
    const yield_ = calculateRentalYield(2500000, 15000);
    // (15000 * 12) / 2500000 * 100 = 7.2%
    expect(yield_).toBeCloseTo(7.2, 1);
  });

  test('higher rent = higher yield', () => {
    const lowRent = calculateRentalYield(2500000, 10000);
    const highRent = calculateRentalYield(2500000, 20000);
    expect(highRent).toBeGreaterThan(lowRent);
  });

  test('lower property value = higher yield', () => {
    const expensive = calculateRentalYield(5000000, 15000);
    const cheap = calculateRentalYield(2000000, 15000);
    expect(cheap).toBeGreaterThan(expensive);
  });
});
