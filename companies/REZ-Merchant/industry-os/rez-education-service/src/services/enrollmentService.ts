import { v4 as uuidv4 } from 'uuid';
import { Batch, BatchStatus, Student, StudentStatus, PaymentStatus, IBatch, IStudent } from '../models';
import logger from '../utils/logger';

export interface EnrollmentResult {
  success: boolean;
  student?: IStudent;
  batch?: IBatch;
  message: string;
}

export interface EnrollStudentInput {
  batchId: string;
  studentId: string;
  merchantId: string;
  paymentStatus?: 'PAID' | 'PENDING' | 'PARTIAL' | 'OVERDUE';
}

export class EnrollmentService {
  /**
   * Enroll a student in a batch
   */
  async enrollStudent(input: EnrollStudentInput): Promise<EnrollmentResult> {
    const { batchId, studentId, merchantId, paymentStatus } = input;

    // Find the batch
    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    // Check batch capacity
    if (batch.enrolledStudents >= batch.maxStudents) {
      throw new Error(`Batch ${batchId} is full. Maximum ${batch.maxStudents} students allowed.`);
    }

    // Check batch status
    if (batch.status !== BatchStatus.UPCOMING && batch.status !== BatchStatus.ONGOING) {
      throw new Error(`Cannot enroll in batch with status: ${batch.status}`);
    }

    // Find the student
    const student = await Student.findOne({ studentId });
    if (!student) {
      throw new Error(`Student ${studentId} not found`);
    }

    // Check if student is already enrolled in this batch
    if (student.batchId === batchId && student.status === StudentStatus.ACTIVE) {
      throw new Error(`Student ${studentId} is already enrolled in batch ${batchId}`);
    }

    // Check if student is already enrolled in another batch
    if (student.batchId && student.batchId !== batchId) {
      logger.warn(`Student ${studentId} is being transferred from batch ${student.batchId} to ${batchId}`);
    }

    // Update student with batch enrollment
    const updatedStudent = await Student.findOneAndUpdate(
      { studentId },
      {
        $set: {
          batchId: batchId,
          merchantId: merchantId,
          status: StudentStatus.ACTIVE,
          paymentStatus: (paymentStatus as PaymentStatus) || PaymentStatus.PENDING,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updatedStudent) {
      throw new Error(`Failed to update student ${studentId}`);
    }

    // Increment batch enrolled students count
    await Batch.findOneAndUpdate(
      { batchId },
      {
        $inc: { enrolledStudents: 1 },
        $set: { updatedAt: new Date() }
      }
    );

    logger.info(`Student ${studentId} enrolled in batch ${batchId}`);

    return {
      success: true,
      student: updatedStudent,
      batch: await Batch.findOne({ batchId }),
      message: `Student ${student.name} successfully enrolled in batch ${batch.name}`
    };
  }

  /**
   * Unenroll a student from a batch
   */
  async unenrollStudent(batchId: string, studentId: string): Promise<EnrollmentResult> {
    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      throw new Error(`Student ${studentId} not found`);
    }

    if (student.batchId !== batchId) {
      throw new Error(`Student ${studentId} is not enrolled in batch ${batchId}`);
    }

    const updatedStudent = await Student.findOneAndUpdate(
      { studentId },
      {
        $set: {
          batchId: undefined,
          status: StudentStatus.DROPPED,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updatedStudent) {
      throw new Error(`Failed to update student ${studentId}`);
    }

    // Decrement batch enrolled students count
    await Batch.findOneAndUpdate(
      { batchId },
      {
        $inc: { enrolledStudents: -1 },
        $set: { updatedAt: new Date() }
      }
    );

    logger.info(`Student ${studentId} unenrolled from batch ${batchId}`);

    return {
      success: true,
      student: updatedStudent,
      batch: await Batch.findOne({ batchId }),
      message: `Student ${student.name} successfully unenrolled from batch ${batch.name}`
    };
  }

  /**
   * Transfer a student from one batch to another
   */
  async transferStudent(
    studentId: string,
    fromBatchId: string,
    toBatchId: string
  ): Promise<EnrollmentResult> {
    const [fromBatch, toBatch] = await Promise.all([
      Batch.findOne({ batchId: fromBatchId }),
      Batch.findOne({ batchId: toBatchId })
    ]);

    if (!fromBatch) {
      throw new Error(`Source batch ${fromBatchId} not found`);
    }
    if (!toBatch) {
      throw new Error(`Target batch ${toBatchId} not found`);
    }

    if (toBatch.enrolledStudents >= toBatch.maxStudents) {
      throw new Error(`Target batch ${toBatchId} is full. Maximum ${toBatch.maxStudents} students allowed.`);
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      throw new Error(`Student ${studentId} not found`);
    }

    if (student.batchId !== fromBatchId) {
      throw new Error(`Student ${studentId} is not enrolled in batch ${fromBatchId}`);
    }

    // Update student batch
    const updatedStudent = await Student.findOneAndUpdate(
      { studentId },
      {
        $set: {
          batchId: toBatchId,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updatedStudent) {
      throw new Error(`Failed to update student ${studentId}`);
    }

    // Update batch counts
    await Promise.all([
      Batch.findOneAndUpdate(
        { batchId: fromBatchId },
        { $inc: { enrolledStudents: -1 } }
      ),
      Batch.findOneAndUpdate(
        { batchId: toBatchId },
        { $inc: { enrolledStudents: 1 } }
      )
    ]);

    logger.info(`Student ${studentId} transferred from batch ${fromBatchId} to ${toBatchId}`);

    return {
      success: true,
      student: updatedStudent,
      batch: await Batch.findOne({ batchId: toBatchId }),
      message: `Student ${student.name} transferred from ${fromBatch.name} to ${toBatch.name}`
    };
  }

  /**
   * Get enrollment statistics for a batch
   */
  async getBatchEnrollmentStats(batchId: string): Promise<{
    batch: IBatch;
    totalEnrolled: number;
    activeStudents: number;
    graduatedStudents: number;
    droppedStudents: number;
    availableSeats: number;
    fillRate: number;
  }> {
    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    const allStudents = await Student.find({ batchId });

    return {
      batch,
      totalEnrolled: allStudents.length,
      activeStudents: allStudents.filter(s => s.status === StudentStatus.ACTIVE).length,
      graduatedStudents: allStudents.filter(s => s.status === StudentStatus.GRADUATED).length,
      droppedStudents: allStudents.filter(s => s.status === StudentStatus.DROPPED).length,
      availableSeats: batch.maxStudents - batch.enrolledStudents,
      fillRate: batch.maxStudents > 0 ? (batch.enrolledStudents / batch.maxStudents) * 100 : 0
    };
  }

  /**
   * Get students eligible for graduation from a batch
   */
  async getGraduationEligibleStudents(batchId: string, minAttendanceRate: number = 75): Promise<IStudent[]> {
    return Student.find({
      batchId,
      status: StudentStatus.ACTIVE,
      attendanceRate: { $gte: minAttendanceRate }
    }).sort({ attendanceRate: -1 });
  }
}

export const enrollmentService = new EnrollmentService();