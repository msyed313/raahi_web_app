import { DriverStatus } from './auth/driver-auth.service';

export type DriverDocType = 'LicenseFront' | 'LicenseBack' | 'VehiclePhoto';


export interface DriverDocInfo {
  docType: DriverDocType;
  sizeBytes: number;
  uploadedAtUtc: string;
}

export interface DriverProfile {
  fullName: string;
  email: string;
  phone: string;
  approvalStatus: DriverStatus;
  rejectionReason: string | null;
  isActive: boolean;
  isOnline: boolean;
  cnicNumber: string | null;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  vehicleTypeId: number | null;
  vehicleType: string | null;
  plateNumber: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  vehicleColor: string | null;
  documents: DriverDocInfo[];
  missing: string[];
  canEdit: boolean;
  canSubmit: boolean;
  averageRating: number | null;
  ratingCount: number;
}

export interface UpdateDriverProfile {
  fullName: string;
  phone: string;
  cnicNumber: string | null;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  vehicleTypeId: number | null;
  plateNumber: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  vehicleColor: string | null;
}

export interface DriverJob {
  bookingId: number;
  bookingRef: string;
  status: string;
  pickupDateTime: string;
  pickupAddress: string;
  dropoffAddress: string;
  passengers: number;
  luggage: number;
  flightNumber: string | null;
  notes: string | null;
  vehicleType: string;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  collectCash: boolean;
  customerName: string | null;
  customerPhone: string | null;
  accepted: boolean;
  startedAtUtc: string | null;
  canStart: boolean;
  canComplete: boolean;
}

export interface DriverJobs {
  upcoming: DriverJob[];
  history: DriverJob[];
}