export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  targetType: string;
  targetId: string;
  description: string;
  before?: any;
  after?: any;
  timestamp?: any;
}

export interface ScanLog {
  id: string;
  itemId: string;
  inventoryCode: string;
  userId: string;
  userName: string;
  timestamp?: any;
  userAgent?: string;
  deviceType?: string;
}
