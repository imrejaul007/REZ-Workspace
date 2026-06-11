import { Drug, IDrug } from '../models/Drug';
import { z } from 'zod';

const InteractionCheckSchema = z.object({
  drugIds: z.array(z.string()).min(2, 'At least 2 drugs required'),
  drugNames: z.array(z.string()).optional()
});

export type InteractionCheckRequest = z.infer<typeof InteractionCheckSchema>;

export interface InteractionResult {
  drug1: string;
  drug2: string;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  description: string;
  recommendation: string;
}

export interface InteractionCheckResponse {
  totalInteractions: number;
  severeInteractions: number;
  moderateInteractions: number;
  mildInteractions: number;
  interactions: InteractionResult[];
  warnings: string[];
}

export class InteractionService {
  private knownInteractions: Map<string, InteractionResult> = new Map();

  constructor() {
    this.initializeKnownInteractions();
  }

  private initializeKnownInteractions(): void {
    const interactions: InteractionResult[] = [
      {
        drug1: 'warfarin',
        drug2: 'aspirin',
        severity: 'severe',
        description: 'Aspirin increases the anticoagulant effect of warfarin, significantly increasing bleeding risk.',
        recommendation: 'Avoid combination unless specifically prescribed. Monitor INR closely if used together.'
      },
      {
        drug1: 'metformin',
        drug2: 'contrast_dye',
        severity: 'severe',
        description: 'Contrast dye can cause acute kidney injury, increasing metformin accumulation and risk of lactic acidosis.',
        recommendation: 'Hold metformin before and 48 hours after contrast procedures. Check renal function.'
      },
      {
        drug1: 'ibuprofen',
        drug2: 'warfarin',
        severity: 'severe',
        description: 'NSAIDs increase bleeding risk when combined with anticoagulants.',
        recommendation: 'Avoid NSAIDs. Use acetaminophen for pain if possible.'
      },
      {
        drug1: 'amoxicillin',
        drug2: 'warfarin',
        severity: 'moderate',
        description: 'Antibiotics can reduce vitamin K-producing gut bacteria, increasing warfarin effect.',
        recommendation: 'Monitor INR more frequently during antibiotic course. Adjust dose if needed.'
      },
      {
        drug1: 'azithromycin',
        drug2: 'warfarin',
        severity: 'moderate',
        description: 'May increase anticoagulant effect of warfarin.',
        recommendation: 'Monitor INR. Consider temporary dose reduction.'
      },
      {
        drug1: 'omeprazole',
        drug2: 'clopidogrel',
        severity: 'moderate',
        description: 'PPIs may reduce the activation of clopidogrel, potentially reducing its antiplatelet effect.',
        recommendation: 'Consider H2 blockers as alternative. Pantoprazole has less interaction potential.'
      },
      {
        drug1: 'amlodipine',
        drug2: 'simvastatin',
        severity: 'moderate',
        description: 'Amlodipine increases simvastatin levels, increasing risk of myopathy.',
        recommendation: 'Limit simvastatin to20mg daily when combined with amlodipine.'
      },
      {
        drug1: 'cetirizine',
        drug2: 'alcohol',
        severity: 'mild',
        description: 'Both cause CNS depression. Combined use may increase drowsiness.',
        recommendation: 'Avoid alcohol while taking cetirizine. Use caution when operating machinery.'
      },
      {
        drug1: 'ibuprofen',
        drug2: 'aspirin',
        severity: 'moderate',
        description: 'Ibuprofen may reduce the cardioprotective effect of low-dose aspirin.',
        recommendation: 'Take aspirin30 minutes before or8 hours after ibuprofen.'
      },
      {
        drug1: 'paracetamol',
        drug2: 'alcohol',
        severity: 'moderate',
        description: 'Chronic alcohol use increases hepatotoxicity risk with paracetamol.',
        recommendation: 'Limit alcohol intake. Do not exceed 2g paracetamol if regular alcohol use.'
      }
    ];

    interactions.forEach(interaction => {
      const key1 = `${interaction.drug1}-${interaction.drug2}`.toLowerCase();
      const key2 = `${interaction.drug2}-${interaction.drug1}`.toLowerCase();
      this.knownInteractions.set(key1, interaction);
      this.knownInteractions.set(key2, interaction);
    });
  }

  async checkInteractions(drugIds: string[]): Promise<InteractionCheckResponse> {
    const interactions: InteractionResult[] = [];
    const warnings: string[] = [];

    const drugs = await Drug.find({
      $or: [
        { _id: { $in: drugIds } },
        { genericName: { $in: drugIds } },
        { name: { $in: drugIds } }
      ]
    }).lean().exec();

    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        const drug1 = drugs[i];
        const drug2 = drugs[j];

        const interaction = this.findInteraction(drug1, drug2);
        if (interaction) {
          interactions.push(interaction);

          if (interaction.severity === 'severe') {
            warnings.push(`SEVERE: ${drug1.genericName} + ${drug2.genericName} - ${interaction.description}`);
          } else if (interaction.severity === 'moderate') {
            warnings.push(`MODERATE: ${drug1.genericName} + ${drug2.genericName} - ${interaction.description}`);
          }
        }

        const dbInteraction1 = drug1.interactions?.find(
          (i: { drugId: string }) => i.drugId.toLowerCase() === drug2.genericName.toLowerCase()
        );
        if (dbInteraction1) {
          interactions.push({
            drug1: drug1.genericName,
            drug2: drug2.genericName,
            severity: dbInteraction1.severity,
            description: dbInteraction1.description,
            recommendation: `Use with caution. ${dbInteraction1.description}`
          });
        }

        const dbInteraction2 = drug2.interactions?.find(
          (i: { drugId: string }) => i.drugId.toLowerCase() === drug1.genericName.toLowerCase()
        );
        if (dbInteraction2) {
          interactions.push({
            drug1: drug2.genericName,
            drug2: drug1.genericName,
            severity: dbInteraction2.severity,
            description: dbInteraction2.description,
            recommendation: `Use with caution. ${dbInteraction2.description}`
          });
        }
      }
    }

    const uniqueInteractions = this.deduplicateInteractions(interactions);

    return {
      totalInteractions: uniqueInteractions.length,
      severeInteractions: uniqueInteractions.filter(i => i.severity === 'severe').length,
      moderateInteractions: uniqueInteractions.filter(i => i.severity === 'moderate').length,
      mildInteractions: uniqueInteractions.filter(i => i.severity === 'mild').length,
      interactions: uniqueInteractions,
      warnings
    };
  }

  private findInteraction(drug1: IDrug, drug2: IDrug): InteractionResult | null {
    const key1 = `${drug1.genericName.toLowerCase()}-${drug2.genericName.toLowerCase()}`;
    const key2 = `${drug2.genericName.toLowerCase()}-${drug1.genericName.toLowerCase()}`;

    return this.knownInteractions.get(key1) || this.knownInteractions.get(key2) || null;
  }

  private deduplicateInteractions(interactions: InteractionResult[]): InteractionResult[] {
    const seen = new Set<string>();
    return interactions.filter(interaction => {
      const key = `${interaction.drug1}-${interaction.drug2}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async getDrugInteractions(drugId: string): Promise<InteractionResult[]> {
    const drug = await Drug.findById(drugId).lean().exec();
    if (!drug) return [];

    const interactions: InteractionResult[] = [];

    if (drug.interactions) {
      for (const dbInteraction of drug.interactions) {
        const interactingDrug = await Drug.findOne({
          $or: [
            { genericName: dbInteraction.drugId },
            { name: dbInteraction.drugId }
          ]
        }).lean().exec();

        if (interactingDrug) {
          interactions.push({
            drug1: drug.genericName,
            drug2: interactingDrug.genericName,
            severity: dbInteraction.severity,
            description: dbInteraction.description,
            recommendation: `Use with caution when combining ${drug.genericName} with ${interactingDrug.genericName}.`
          });
        }
      }
    }

    return interactions;
  }
}

export const interactionService = new InteractionService();
