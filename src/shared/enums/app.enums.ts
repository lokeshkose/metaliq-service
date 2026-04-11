export enum Platform {
  WEB = 'WEB',
  ANDROID = 'ANDROID',
  IOS = 'IOS',
}

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  EMPLOYEE = 'EMPLOYEE',
  ADMIN = 'ADMIN',
}

export enum Language {
  EN = 'EN',
  HI = 'HI',
}

/**
 * Supported audit actions.
 */
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  RESTORE = 'RESTORE',
}

export enum Token {
  EXPIRED_IN = '1000m',
  EXPIRED_IN_MS = 100 * 60 * 1000,
}

export enum Session {
  EXPIRED_IN_MS = 100 * 60 * 1000,
}
