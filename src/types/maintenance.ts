export type MaintenanceType = 
  | 'Preventive'
  | 'Corrective'
  | 'Inspection'
  | 'Cleaning'
  | 'Repair'
  | 'Replacement'
  | 'Other';

export interface MaintenanceRecord {
  id: string;
  itemId: string;
  date: string; // YYYY-MM-DD
  type: MaintenanceType;
  complaint: string;
  action: string;
  technicianId?: string;
  technicianNameSnapshot: string;
  cost: number;
  result: string;
  notes?: string;
  nextMaintenanceDate?: string;
  attachments?: string[];
  createdAt?: any;
  createdBy?: string;
  updatedAt?: any;
  updatedBy?: string;
}
