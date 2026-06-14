export class DocumentNotFoundError extends Error {
  constructor(documentType: string, identifier: string) {
    super(`${documentType} with identifier '${identifier}' not found`);
    this.name = 'DocumentNotFoundError';
  }
}

export class ValidationError extends Error {
  errors: Record<string, string>;

  constructor(errors: Record<string, string>) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class DuplicateError extends Error {
  field: string;

  constructor(field: string, value: string) {
    super(`Duplicate value '${value}' for field '${field}'`);
    this.name = 'DuplicateError';
    this.field = field;
  }
}

export class InvalidOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOperationError';
  }
}

export class StageTransitionError extends Error {
  fromStage: string;
  toStage: string;

  constructor(fromStage: string, toStage: string) {
    super(`Cannot transition from stage '${fromStage}' to '${toStage}'`);
    this.name = 'StageTransitionError';
    this.fromStage = fromStage;
    this.toStage = toStage;
  }
}