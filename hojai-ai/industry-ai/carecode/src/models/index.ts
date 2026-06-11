import mongoose, { Schema, Document } from 'mongoose';

export interface IPatient extends Document {
  patientId: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  bloodType?: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  merchantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>({
  patientId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  bloodType: String,
  allergies: [String],
  conditions: [String],
  medications: [String],
  merchantId: { type: String, required: true, index: true },
}, { timestamps: true });

PatientSchema.index({ merchantId: 1, phone: 1 });

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);

export interface IAppointment extends Document {
  appointmentId: string;
  patientId: string;
  doctorId?: string;
  doctorName?: string;
  merchantId: string;
  date: Date;
  time: string;
  duration: number;
  type: 'consultation' | 'procedure' | 'followup' | 'emergency';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  reason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>({
  appointmentId: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  doctorId: String,
  doctorName: String,
  merchantId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  time: { type: String, required: true },
  duration: { type: Number, default: 30 },
  type: { type: String, enum: ['consultation', 'procedure', 'followup', 'emergency'], default: 'consultation' },
  status: { type: String, enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'], default: 'scheduled' },
  reason: String,
  notes: String,
}, { timestamps: true });

AppointmentSchema.index({ merchantId: 1, date: 1, status: 1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);

export interface IMedicalRecord extends Document {
  recordId: string;
  patientId: string;
  appointmentId?: string;
  merchantId: string;
  type: 'diagnosis' | 'prescription' | 'lab' | 'imaging' | 'procedure' | 'note';
  title: string;
  description: string;
  doctorName?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MedicalRecordSchema = new Schema<IMedicalRecord>({
  recordId: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  appointmentId: String,
  merchantId: { type: String, required: true, index: true },
  type: { type: String, enum: ['diagnosis', 'prescription', 'lab', 'imaging', 'procedure', 'note'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  doctorName: String,
  attachments: [String],
}, { timestamps: true });

export const MedicalRecord = mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);

export interface IVital extends Document {
  vitalId: string;
  patientId: string;
  merchantId: string;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  bloodSugar?: number;
  recordedAt: Date;
  createdAt: Date;
}

const VitalSchema = new Schema<IVital>({
  vitalId: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  bloodPressure: String,
  heartRate: Number,
  temperature: Number,
  weight: Number,
  height: Number,
  bloodSugar: Number,
  recordedAt: { type: Date, default: Date.now },
}, { timestamps: true });

VitalSchema.index({ patientId: 1, recordedAt: -1 });

export const Vital = mongoose.model<IVital>('Vital', VitalSchema);

export default { Patient, Appointment, MedicalRecord, Vital };