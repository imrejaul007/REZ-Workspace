/**
 * Investment Calculator Service
 * EMI, ROI, Rental Yield, Affordability
 */

export interface EMIInput {
  principal: number;
  interestRate: number;
  tenureMonths: number;
}

export interface EMIResult {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  monthlyBreakdown: MonthlyBreakdown[];
}

export interface MonthlyBreakdown {
  month: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface ROIInput {
  purchasePrice: number;
  expectedRent: number;
  appreciation: number;
  holdingPeriodYears: number;
  currency: string;
}

export interface ROIResult {
  roi: number;
  totalReturn: number;
  capitalAppreciation: number;
  rentalIncome: number;
  netYield: number;
  annualizedROI: number;
}

export interface AffordabilityInput {
  monthlyIncome: number;
  existingEMI: number;
  loanAmount: number;
  interestRate: number;
  tenureMonths: number;
}

export interface AffordabilityResult {
  affordable: boolean;
  maxAffordableEMI: number;
  maxAffordableLoan: number;
  suggestedDownPayment: number;
  dtiRatio: number;
}

export class InvestmentService {

  /**
   * Calculate EMI
   */
  calculateEMI(input: EMIInput): EMIResult {
    const { principal, interestRate, tenureMonths } = input;

    // Monthly interest rate
    const monthlyRate = interestRate / 12 / 100;

    // EMI formula: [P x R x (1+R)^N] / [(1+R)^N - 1]
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) /
                (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    const totalPayment = emi * tenureMonths;
    const totalInterest = totalPayment - principal;

    // Generate monthly breakdown
    const monthlyBreakdown: MonthlyBreakdown[] = [];
    let balance = principal;

    for (let month = 1; month <= tenureMonths; month++) {
      const interestPortion = balance * monthlyRate;
      const principalPortion = emi - interestPortion;
      balance = Math.max(0, balance - principalPortion);

      monthlyBreakdown.push({
        month,
        principal: Math.round(principalPortion * 100) / 100,
        interest: Math.round(interestPortion * 100) / 100,
        balance: Math.round(balance * 100) / 100
      });
    }

    return {
      emi: Math.round(emi * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      monthlyBreakdown
    };
  }

  /**
   * Calculate ROI for investment property
   */
  calculateROI(input: ROIInput): ROIResult {
    const { purchasePrice, expectedRent, appreciation, holdingPeriodYears, currency } = input;

    // Annual rental income
    const annualRent = expectedRent * 12;

    // Capital appreciation over period
    const capitalAppreciation = purchasePrice * Math.pow(1 + appreciation / 100, holdingPeriodYears) - purchasePrice;

    // Total rental income over period
    const rentalIncome = annualRent * holdingPeriodYears;

    // Total return
    const totalReturn = capitalAppreciation + rentalIncome;

    // ROI percentage
    const roi = (totalReturn / purchasePrice) * 100;

    // Net yield (annual rental / purchase price)
    const netYield = (annualRent / purchasePrice) * 100;

    // Annualized ROI
    const annualizedROI = roi / holdingPeriodYears;

    return {
      roi: Math.round(roi * 100) / 100,
      totalReturn: Math.round(totalReturn * 100) / 100,
      capitalAppreciation: Math.round(capitalAppreciation * 100) / 100,
      rentalIncome: Math.round(rentalIncome * 100) / 100,
      netYield: Math.round(netYield * 100) / 100,
      annualizedROI: Math.round(annualizedROI * 100) / 100
    };
  }

  /**
   * Calculate rental yield
   */
  calculateRentalYield(purchasePrice: number, monthlyRent: number): {
    grossYield: number;
    netYield: number;
    category: string;
  } {
    const annualRent = monthlyRent * 12;
    const grossYield = (annualRent / purchasePrice) * 100;

    // Assume 30% expenses (maintenance, management, taxes)
    const netYield = grossYield * 0.70;

    let category = 'Average';
    if (netYield >= 8) category = 'Excellent';
    else if (netYield >= 6) category = 'Good';
    else if (netYield >= 4) category = 'Fair';

    return {
      grossYield: Math.round(grossYield * 100) / 100,
      netYield: Math.round(netYield * 100) / 100,
      category
    };
  }

  /**
   * Calculate affordability
   */
  calculateAffordability(input: AffordabilityInput): AffordabilityResult {
    const { monthlyIncome, existingEMI, loanAmount, interestRate, tenureMonths } = input;

    // DTI ratio (Debt-to-Income) - banks typically allow 40-50%
    const maxDTI = 0.50;
    const availableForEMI = monthlyIncome * maxDTI - existingEMI;

    // Calculate max affordable EMI
    const maxAffordableEMI = Math.max(0, availableForEMI);

    // Calculate max affordable loan at this EMI
    let maxAffordableLoan = 0;
    if (maxAffordableEMI > 0) {
      const monthlyRate = interestRate / 12 / 100;
      maxAffordableLoan = maxAffordableEMI * (Math.pow(1 + monthlyRate, tenureMonths) - 1) /
                         (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths));
    }

    // DTI ratio
    const dtiRatio = ((existingEMI + maxAffordableEMI) / monthlyIncome) * 100;

    // Suggested down payment
    const suggestedDownPayment = Math.max(0, loanAmount - maxAffordableLoan);

    return {
      affordable: dtiRatio <= 50,
      maxAffordableEMI: Math.round(maxAffordableEMI * 100) / 100,
      maxAffordableLoan: Math.round(maxAffordableLoan * 100) / 100,
      suggestedDownPayment: Math.round(suggestedDownPayment * 100) / 100,
      dtiRatio: Math.round(dtiRatio * 100) / 100
    };
  }

  /**
   * Compare two properties
   */
  compareProperties(properties: Array<{
    name: string;
    price: number;
    rent: number;
    appreciation: number;
  }>): Array<{
    name: string;
    price: number;
    rent: number;
    appreciation: number;
    roi: number;
    netYield: number;
    ranking: number;
  }> {
    const compared = properties.map(p => {
      const roi = this.calculateROI({
        purchasePrice: p.price,
        expectedRent: p.rent,
        appreciation: p.appreciation,
        holdingPeriodYears: 5
      });
      const { netYield } = this.calculateRentalYield(p.price, p.rent);

      return {
        name: p.name,
        price: p.price,
        rent: p.rent,
        appreciation: p.appreciation,
        roi: roi.roi,
        netYield
      };
    });

    // Sort by ROI
    compared.sort((a, b) => b.roi - a.roi);

    // Add ranking
    return compared.map((p, i) => ({ ...p, ranking: i + 1 }));
  }

  /**
   * Golden Visa eligibility based on property value
   */
  calculateVisaEligibility(propertyValue: number, currency: string): {
    eligible: boolean;
    program: string;
    minInvestment: number;
    gap: number;
  } {
    let minInvestment = 0;
    let program = '';

    if (currency === 'AED') {
      if (propertyValue >= 2000000) {
        return { eligible: true, program: 'Golden Visa (10 Years)', minInvestment: 2000000, gap: 0 };
      }
      minInvestment = 2000000;
      program = 'Golden Visa (10 Years)';

      if (propertyValue >= 545000) {
        return { eligible: true, program: 'Investor Visa (3 Years)', minInvestment: 545000, gap: 0 };
      }
      if (propertyValue < 545000) {
        program = 'Investor Visa (3 Years)';
        minInvestment = 545000;
      }
    } else {
      // INR - convert to AED approx (1 AED = 22.5 INR)
      const valueInAED = propertyValue / 22.5;
      if (valueInAED >= 2000000) {
        return { eligible: true, program: 'Golden Visa (10 Years)', minInvestment: 2000000 * 22.5, gap: 0 };
      }
      if (valueInAED >= 545000) {
        return { eligible: true, program: 'Investor Visa (3 Years)', minInvestment: 545000 * 22.5, gap: 0 };
      }
      minInvestment = 545000 * 22.5;
      program = 'Investor Visa (3 Years)';
    }

    return {
      eligible: false,
      program,
      minInvestment: Math.round(minInvestment * 100) / 100,
      gap: Math.round((minInvestment - propertyValue) * 100) / 100
    };
  }
}

export const investmentService = new InvestmentService();
