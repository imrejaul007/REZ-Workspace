import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    return this.prisma.payment.findMany();
  }

  async findOne(id: string) {
    return this.prisma.payment.findUnique({
      where: { id }
    });
  }

  async create(createPaymentDto: any) {
    return this.prisma.payment.create({
      data: createPaymentDto
    });
  }

  async update(id: string, updatePaymentDto: any) {
    return this.prisma.payment.update({
      where: { id },
      data: updatePaymentDto
    });
  }
}