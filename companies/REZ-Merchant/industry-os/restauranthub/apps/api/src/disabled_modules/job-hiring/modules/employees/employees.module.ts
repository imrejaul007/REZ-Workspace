import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { VerificationService } from './verification.service';

@Module({
  providers: [EmployeesService, VerificationService],
  controllers: [EmployeesController],
  exports: [EmployeesService, VerificationService],
})
export class EmployeesModule {}