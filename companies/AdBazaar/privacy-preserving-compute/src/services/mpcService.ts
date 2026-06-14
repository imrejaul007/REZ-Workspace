import { v4 as uuidv4 } from 'uuid';
import { Computation } from '../models/Computation.js';
import { MPCResult, IMPCShare } from '../models/MPCResult.js';
import { AuditLog } from '../models/AuditLog.js';
import { AuditAction, ComputationType, ComputationStatus, MPCConfig } from '../types/index.js';
import { logger, privacyLogger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';

export interface MPCInput {
  computationId?: string;
  operation: 'addition' | 'multiplication' | 'comparison' | 'dot_product';
  parties: string[];
  inputs: Record<string, string>;
  config?: Partial<MPCConfig>;
}

export interface MPCOutput {
  computationId: string;
  status: ComputationStatus;
  shares: IMPCShare[];
  operation: string;
  threshold: number;
  reconstructedValue: string | null;
}

export class MPCService {
  /**
   * Multi-Party Computation
   * Implements secret sharing and secure computation
   */
  async compute(input: MPCInput): Promise<MPCOutput> {
    const startTime = Date.now();
    const computationId = input.computationId || uuidv4();

    logger.info('Starting MPC computation', {
      computationId,
      operation: input.operation,
      parties: input.parties.length,
    });

    try {
      // Create computation record
      const computation = await Computation.create({
        computationId,
        type: ComputationType.MPC,
        status: ComputationStatus.PENDING,
        participants: input.parties,
        privacyParams: {
          epsilon: 1.0,
          delta: 1e-5,
          sensitivity: 1.0,
          mechanism: 'none',
        },
        config: input.config || {},
      });

      await this.logAudit(computationId, AuditAction.COMPUTATION_CREATED, 'system', {
        operation: input.operation,
        parties: input.parties,
      });

      // Update status
      computation.status = ComputationStatus.RUNNING;
      computation.startedAt = new Date();
      await computation.save();

      await this.logAudit(computationId, AuditAction.COMPUTATION_STARTED, 'system', {});

      const threshold = input.config?.threshold || 2;
      const modulus = input.config?.modulus || 'prime';

      // Generate shares for each party
      const shares = await this.generateShares(computationId, input.parties, input.inputs);

      // Perform the MPC operation
      let reconstructedValue: string | null = null;

      switch (input.operation) {
        case 'addition':
          reconstructedValue = await this.secureAddition(shares, modulus);
          break;
        case 'multiplication':
          reconstructedValue = await this.secureMultiplication(shares, modulus);
          break;
        case 'comparison':
          reconstructedValue = await this.secureComparison(shares, modulus);
          break;
        case 'dot_product':
          reconstructedValue = await this.secureDotProduct(shares, modulus);
          break;
      }

      // Create MPC result
      const mpcResult = await MPCResult.create({
        computationId,
        shares,
        reconstructedValue,
        operation: input.operation,
        threshold,
        totalParties: input.parties.length,
        participatingParties: input.parties,
        completedAt: new Date(),
      });

      // Update computation
      computation.status = ComputationStatus.COMPLETED;
      computation.result = {
        operation: input.operation,
        threshold,
        reconstructedValue,
      };
      computation.completedAt = new Date();
      await computation.save();

      await this.logAudit(computationId, AuditAction.COMPUTATION_COMPLETED, 'system', {
        operation: input.operation,
        threshold,
      });

      metrics.mpcOperationsTotal.labels(input.operation, 'completed').inc();
      metrics.computationsTotal.labels('mpc', 'completed').inc();
      metrics.computationDuration.labels('mpc').observe((Date.now() - startTime) / 1000);

      privacyLogger.info('MPC computation completed', {
        computationId,
        operation: input.operation,
        parties: input.parties.length,
      });

      return {
        computationId,
        status: ComputationStatus.COMPLETED,
        shares: mpcResult.shares,
        operation: mpcResult.operation,
        threshold: mpcResult.threshold,
        reconstructedValue: mpcResult.reconstructedValue,
      };
    } catch (error) {
      logger.error('MPC computation failed', {
        computationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      await Computation.findOneAndUpdate(
        { computationId },
        {
          status: ComputationStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );

      await this.logAudit(computationId, AuditAction.COMPUTATION_FAILED, 'system', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      metrics.mpcOperationsTotal.labels(input.operation, 'failed').inc();
      metrics.computationsTotal.labels('mpc', 'failed').inc();

      throw error;
    }
  }

  /**
   * Generate secret shares using Shamir's Secret Sharing
   */
  private async generateShares(
    computationId: string,
    parties: string[],
    inputs: Record<string, string>
  ): Promise<IMPCShare[]> {
    const shares: IMPCShare[] = [];
    const prime = this.getPrimeForModulus('prime');

    // Generate a polynomial for each input
    for (const [partyId, value] of Object.entries(inputs)) {
      const secret = BigInt(value);
      const threshold = 2; // Minimum shares needed for reconstruction

      // Generate random coefficients for polynomial
      const coefficients = [secret];
      for (let i = 1; i < threshold; i++) {
        coefficients.push(BigInt(Math.floor(Math.random() * Number(prime))));
      }

      // Evaluate polynomial at each party's x-coordinate
      for (let i = 0; i < parties.length; i++) {
        const x = BigInt(i + 1); // Party index + 1
        let y = BigInt(0);

        for (let j = 0; j < coefficients.length; j++) {
          const xPower = this.powMod(x, BigInt(j), prime);
          y = (y + (coefficients[j] * xPower) % prime) % prime;
        }

        shares.push({
          partyId: parties[i],
          shareValue: y.toString(),
          index: i,
        });

        metrics.mpcSharesGenerated.inc();
      }
    }

    return shares;
  }

  /**
   * Get prime number for modulus
   */
  private getPrimeForModulus(modulus: string): bigint {
    // Use a standard prime for secret sharing
    const primes: Record<string, bigint> = {
      prime: BigInt('115792089237316195423570985008687907853269984665640564039457584007913129640233'),
      small: BigInt('18014398509481981'),
    };
    return primes[modulus] || primes.prime;
  }

  /**
   * Modular exponentiation
   */
  private powMod(base: bigint, exp: bigint, mod: bigint): bigint {
    let result = BigInt(1);
    base = base % mod;

    while (exp > BigInt(0)) {
      if (exp % BigInt(2) === BigInt(1)) {
        result = (result * base) % mod;
      }
      exp = exp / BigInt(2);
      base = (base * base) % mod;
    }

    return result;
  }

  /**
   * Secure addition of shared values
   */
  private async secureAddition(shares: IMPCShare[], modulus: string): Promise<string> {
    const prime = this.getPrimeForModulus(modulus);

    // Group shares by party
    const partyShares: Record<string, bigint> = {};
    for (const share of shares) {
      if (!partyShares[share.partyId]) {
        partyShares[share.partyId] = BigInt(0);
      }
      partyShares[share.partyId] =
        (partyShares[share.partyId] + BigInt(share.shareValue)) % prime;
    }

    // Sum all party shares
    let total = BigInt(0);
    for (const value of Object.values(partyShares)) {
      total = (total + value) % prime;
    }

    return total.toString();
  }

  /**
   * Secure multiplication of shared values
   */
  private async secureMultiplication(shares: IMPCShare[], modulus: string): Promise<string> {
    // For simplicity, perform local multiplication
    // In production, would use Beaver's triplets for secure multiplication
    const prime = this.getPrimeForModulus(modulus);

    // Get unique input values (first share from each input)
    const inputs = [...new Set(shares.map(s => s.shareValue))];
    let result = BigInt(1);

    for (const input of inputs) {
      result = (result * BigInt(input)) % prime;
    }

    return result.toString();
  }

  /**
   * Secure comparison of shared values
   */
  private async secureComparison(shares: IMPCShare[], modulus: string): Promise<string> {
    const prime = this.getPrimeForModulus(modulus);

    // Get first two shares for comparison
    const shareValues = shares.slice(0, 2).map(s => BigInt(s.shareValue));

    if (shareValues.length < 2) {
      return '0';
    }

    const diff = (shareValues[0] - shareValues[1] + prime) % prime;
    const isGreater = diff > prime / BigInt(2) ? '1' : '0';

    return isGreater;
  }

  /**
   * Secure dot product of shared vectors
   */
  private async secureDotProduct(shares: IMPCShare[], modulus: string): Promise<string> {
    const prime = this.getPrimeForModulus(modulus);

    // Group shares by party
    const partyShares: Record<string, bigint[]> = {};
    for (const share of shares) {
      if (!partyShares[share.partyId]) {
        partyShares[share.partyId] = [];
      }
      partyShares[share.partyId].push(BigInt(share.shareValue));
    }

    // Calculate dot product
    let dotProduct = BigInt(0);
    const parties = Object.keys(partyShares);

    if (parties.length < 2) {
      return '0';
    }

    const shareCount = Math.min(
      partyShares[parties[0]].length,
      partyShares[parties[1]].length
    );

    for (let i = 0; i < shareCount; i++) {
      dotProduct =
        (dotProduct + partyShares[parties[0]][i] * partyShares[parties[1]][i]) % prime;
    }

    return dotProduct.toString();
  }

  /**
   * Reconstruct secret from shares (Lagrange interpolation)
   */
  async reconstruct(shares: IMPCShare[], threshold: number): Promise<string | null> {
    if (shares.length < threshold) {
      return null;
    }

    const prime = this.getPrimeForModulus('prime');
    let secret = BigInt(0);

    // Lagrange interpolation at x=0
    for (let i = 0; i < threshold; i++) {
      const share = shares[i];
      let numerator = BigInt(1);
      let denominator = BigInt(1);

      for (let j = 0; j < threshold; j++) {
        if (i !== j) {
          const xj = BigInt(j + 1);
          numerator = (numerator * (-xj)) % prime;
          denominator = (denominator * (BigInt(i + 1) - xj + prime)) % prime;
        }
      }

      const lagrangeCoeff = (numerator * this.modInverse(denominator, prime)) % prime;
      secret = (secret + BigInt(share.shareValue) * lagrangeCoeff) % prime;
    }

    metrics.mpcReconstructionsTotal.labels('success').inc();

    return ((secret % prime) + prime).toString();
  }

  /**
   * Modular multiplicative inverse
   */
  private modInverse(a: bigint, mod: bigint): bigint {
    let [old_r, r] = [a % mod, mod];
    let [old_s, s] = [BigInt(1), BigInt(0)];

    while (r !== BigInt(0)) {
      const quotient = old_r / r;
      [old_r, r] = [r, old_r - quotient * r];
      [old_s, s] = [s, old_s - quotient * s];
    }

    return ((old_s % mod) + mod) % mod;
  }

  /**
   * Log audit entry
   */
  private async logAudit(
    computationId: string,
    action: AuditAction,
    actor: string,
    details: Record<string, unknown>
  ): Promise<void> {
    await AuditLog.create({
      computationId,
      action,
      actor,
      details,
      timestamp: new Date(),
    });

    metrics.auditLogsTotal.labels(action).inc();
  }

  /**
   * Get MPC computation status
   */
  async getStatus(computationId: string): Promise<MPCResult | null> {
    return MPCResult.findOne({ computationId });
  }
}

export const mpcService = new MPCService();
export default mpcService;