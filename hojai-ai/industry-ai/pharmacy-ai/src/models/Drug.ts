import mongoose, { Document, Schema } from 'mongoose';

export interface IDrug extends Document {
  name: string;
  genericName: string;
  brandNames: string[];
  category: string;
  description: string;
  composition: {
    activeIngredient: string;
    strength: string;
    form: string;
  };
  dosage: {
    adult: string;
    pediatric?: string;
    renal?: string;
    hepatic?: string;
  };
  indications: string[];
  contraindications: string[];
  sideEffects: {
    common: string[];
    serious: string[];
  };
  interactions: {
    drugId: string;
    severity: 'mild' | 'moderate' | 'severe';
    description: string;
  }[];
  storage: {
    temperature: string;
    conditions: string;
  };
  manufacturer: string;
  country: string;
  schedule: 'OTC' | 'Rx' | 'Schedule H' | 'Schedule X' | 'Controlled';
  createdAt: Date;
  updatedAt: Date;
}

const DrugSchema = new Schema<IDrug>(
  {
    name: { type: String, required: true, index: true },
    genericName: { type: String, required: true, index: true },
    brandNames: [{ type: String }],
    category: {
      type: String,
      required: true,
      enum: [
        'analgesic',
        'antibiotic',
        'antiviral',
        'antifungal',
        'antihistamine',
        'antihypertensive',
        'antidiabetic',
        'cardiovascular',
        'respiratory',
        'gastrointestinal',
        'neurological',
        'psychiatric',
        'oncology',
        'hormonal',
        'vaccine',
        'supplement',
        'other'
      ],
      index: true
    },
    description: { type: String, required: true },
    composition: {
      activeIngredient: { type: String, required: true },
      strength: { type: String, required: true },
      form: { type: String, required: true }
    },
    dosage: {
      adult: { type: String, required: true },
      pediatric: String,
      renal: String,
      hepatic: String
    },
    indications: [{ type: String }],
    contraindications: [{ type: String }],
    sideEffects: {
      common: [{ type: String }],
      serious: [{ type: String }]
    },
    interactions: [{
      drugId: { type: String },
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe']
      },
      description: { type: String }
    }],
    storage: {
      temperature: { type: String },
      conditions: { type: String }
    },
    manufacturer: { type: String },
    country: { type: String, default: 'India' },
    schedule: {
      type: String,
      enum: ['OTC', 'Rx', 'Schedule H', 'Schedule X', 'Controlled'],
      default: 'Rx'
    }
  },
  { timestamps: true }
);

DrugSchema.index({ name: 'text', genericName: 'text', description: 'text' });
DrugSchema.index({ category: 1 });
DrugSchema.index({ genericName: 1 });
DrugSchema.index({ schedule: 1 });

export const Drug = mongoose.model<IDrug>('Drug', DrugSchema);

export const seedDrugs = async () => {
  const count = await Drug.countDocuments();
  if (count > 0) return;

  const drugs = [
    {
      name: 'Paracetamol 500',
      genericName: 'Acetaminophen',
      brandNames: ['Dolo', 'Crocin', 'Calpol', 'Tylenol'],
      category: 'analgesic',
      description: 'Pain reliever and fever reducer',
      composition: {
        activeIngredient: 'Paracetamol',
        strength: '500mg',
        form: 'Tablet'
      },
      dosage: {
        adult: '500-1000mg every 4-6 hours, max 4g/day',
        pediatric: '10-15mg/kg every 4-6 hours'
      },
      indications: ['Fever', 'Headache', 'Muscle pain', 'Toothache'],
      contraindications: ['Severe liver disease', 'Allergy to paracetamol'],
      sideEffects: {
        common: ['Nausea', 'Stomach pain'],
        serious: ['Liver damage (overdose)']
      },
      interactions: [],
      storage: { temperature: 'Room temperature', conditions: 'Keep away from moisture' },
      manufacturer: 'Generic',
      schedule: 'OTC'
    },
    {
      name: 'Amoxicillin 500',
      genericName: 'Amoxicillin',
      brandNames: ['Amoxil', 'Moxatag', 'Trimox'],
      category: 'antibiotic',
      description: 'Penicillin-type antibiotic for bacterial infections',
      composition: {
        activeIngredient: 'Amoxicillin',
        strength: '500mg',
        form: 'Capsule'
      },
      dosage: {
        adult: '250-500mg every 8 hours or 500-875mg every 12 hours',
        pediatric: '20-90mg/kg/day divided'
      },
      indications: ['Respiratory infections', 'UTI', 'Skin infections', 'Ear infections'],
      contraindications: ['Penicillin allergy'],
      sideEffects: {
        common: ['Diarrhea', 'Nausea', 'Rash'],
        serious: ['Anaphylaxis', 'C. diff infection']
      },
      interactions: [
        { drugId: 'warfarin', severity: 'moderate', description: 'May increase bleeding risk' }
      ],
      storage: { temperature: 'Room temperature', conditions: 'Keep away from moisture' },
      manufacturer: 'Generic',
      schedule: 'Rx'
    },
 {
      name: 'Metformin 500',
      genericName: 'Metformin Hydrochloride',
      brandNames: ['Glucophage', 'Fortamet', 'Riomet'],
      category: 'antidiabetic',
      description: 'First-line medication for type 2 diabetes',
      composition: {
        activeIngredient: 'Metformin HCl',
        strength: '500mg',
        form: 'Tablet'
      },
      dosage: {
        adult: '500mg twice daily with meals, max 2550mg/day',
        renal: 'Reduce dose in renal impairment'
      },
      indications: ['Type 2 Diabetes', 'PCOS', 'Insulin resistance'],
      contraindications: ['Severe renal disease', 'Metabolic acidosis'],
      sideEffects: {
        common: ['Nausea', 'Diarrhea', 'Stomach upset'],
        serious: ['Lactic acidosis', 'Vitamin B12 deficiency']
      },
      interactions: [
        { drugId: 'contrast_dye', severity: 'severe', description: 'Hold before contrast procedures' }
      ],
      storage: { temperature: 'Room temperature', conditions: 'Keep away from moisture' },
      manufacturer: 'Generic',
      schedule: 'Rx'
    },
    {
      name: 'Omeprazole 20',
      genericName: 'Omeprazole',
      brandNames: ['Prilosec', 'Losec', 'Omez'],
      category: 'gastrointestinal',
      description: 'Proton pump inhibitor for acid reflux',
      composition: {
        activeIngredient: 'Omeprazole',
        strength: '20mg',
        form: 'Capsule'
      },
      dosage: {
        adult: '20-40mg once daily before breakfast',
        pediatric: '0.7-3.3mg/kg/day'
      },
      indications: ['GERD', 'Peptic ulcer', 'H. pylori', 'Zollinger-Ellison'],
      contraindications: ['Hypersensitivity to PPIs'],
      sideEffects: {
        common: ['Headache', 'Nausea', 'Abdominal pain'],
        serious: ['C. diff infection', 'Bone fractures', 'Hypomagnesemia']
      },
      interactions: [
        { drugId: 'clopidogrel', severity: 'moderate', description: 'May reduce antiplatelet effect' }
      ],
      storage: { temperature: 'Room temperature', conditions: 'Protect from moisture' },
      manufacturer: 'Generic',
      schedule: 'OTC'
    },
    {
      name: 'Amlodipine 5',
      genericName: 'Amlodipine Besylate',
      brandNames: ['Norvasc', 'Istin', 'Amlodin'],
      category: 'antihypertensive',
      description: 'Calcium channel blocker for hypertension',
      composition: {
        activeIngredient: 'Amlodipine',
        strength: '5mg',
        form: 'Tablet'
      },
      dosage: {
        adult: '5-10mg once daily',
        renal: 'No adjustment needed'
      },
      indications: ['Hypertension', 'Angina', 'Coronary artery disease'],
      contraindications: ['Cardiogenic shock', 'Severe aortic stenosis'],
      sideEffects: {
        common: ['Edema', 'Flushing', 'Headache', 'Dizziness'],
        serious: ['Worsening angina', 'Heart failure']
      },
      interactions: [
        { drugId: 'simvastatin', severity: 'moderate', description: 'Limit simvastatin dose' }
      ],
      storage: { temperature: 'Room temperature', conditions: 'Keep away from moisture' },
      manufacturer: 'Generic',
      schedule: 'Rx'
    },
    {
      name: 'Azithromycin 500',
      genericName: 'Azithromycin',
      brandNames: ['Zithromax', 'Z-Pack', 'Azithral'],
      category: 'antibiotic',
      description: 'Macrolide antibiotic for respiratory infections',
      composition: {
        activeIngredient: 'Azithromycin',
        strength: '500mg',
        form: 'Tablet'
      },
      dosage: {
        adult: '500mg on day 1, then 250mg days 2-5',
        pediatric: '10mg/kg on day 1, then 5mg/kg days 2-5'
      },
      indications: ['Respiratory infections', 'STIs', 'Skin infections', 'Ear infections'],
      contraindications: ['Macrolide allergy', 'Liver disease'],
      sideEffects: {
        common: ['Nausea', 'Diarrhea', 'Abdominal pain'],
        serious: ['QT prolongation', 'Hepatotoxicity']
      },
      interactions: [
        { drugId: 'warfarin', severity: 'moderate', description: 'May increase bleeding risk' },
        { drugId: 'antacids', severity: 'mild', description: 'Reduce absorption - separate by 2 hours' }
      ],
      storage: { temperature: 'Room temperature', conditions: 'Keep away from moisture' },
      manufacturer: 'Generic',
      schedule: 'Rx'
    },
    {
      name: 'Cetirizine 10',
      genericName: 'Cetirizine Hydrochloride',
      brandNames: ['Zyrtec', 'Reactine', 'Cetrizet'],
      category: 'antihistamine',
      description: 'Second-generation antihistamine for allergies',
      composition: {
        activeIngredient: 'Cetirizine',
        strength: '10mg',
        form: 'Tablet'
      },
      dosage: {
        adult: '5-10mg once daily',
        pediatric: '2.5-5mg once daily for children 6-12'
      },
      indications: ['Allergic rhinitis', 'Urticaria', 'Allergic conjunctivitis'],
      contraindications: ['End-stage renal disease'],
      sideEffects: {
        common: ['Drowsiness', 'Dry mouth', 'Fatigue'],
        serious: []
      },
      interactions: [],
      storage: { temperature: 'Room temperature', conditions: 'Keep away from moisture' },
      manufacturer: 'Generic',
      schedule: 'OTC'
    },
    {
      name: 'Ibuprofen 400',
      genericName: 'Ibuprofen',
      brandNames: ['Advil', 'Motrin', 'Ibugard'],
      category: 'analgesic',
      description: 'NSAID for pain and inflammation',
      composition: {
        activeIngredient: 'Ibuprofen',
        strength: '400mg',
        form: 'Tablet'
      },
      dosage: {
        adult: '200-400mg every 4-6 hours, max 1200mg/day OTC',
        renal: 'Avoid in severe renal impairment'
      },
      indications: ['Pain', 'Fever', 'Inflammation', 'Arthritis'],
      contraindications: ['NSAID allergy', 'Active GI bleeding', 'Severe renal disease'],
      sideEffects: {
        common: ['Nausea', 'Dyspepsia', 'Dizziness'],
        serious: ['GI bleeding', 'CV events', 'Renal impairment']
      },
      interactions: [
        { drugId: 'aspirin', severity: 'moderate', description: 'May reduce cardioprotective effect' },
        { drugId: 'warfarin', severity: 'severe', description: 'Increased bleeding risk' }
      ],
      storage: { temperature: 'Room temperature', conditions: 'Keep away from moisture' },
      manufacturer: 'Generic',
      schedule: 'OTC'
    }
  ];

  await Drug.insertMany(drugs);
};
