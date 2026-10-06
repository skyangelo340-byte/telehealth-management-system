import {
  Appointment,
  AppointmentStatus,
  DoctorAvailability,
} from '../types';

/**
 * Centralized API Service Layer for the TeleHealth Management System.
 *
 * Architectural Boundary:
 * - Organizes all frontend operations behind clean REST-aligned methods ready to connect to
 *   the existing Django REST / JSON backend and Neon PostgreSQL database.
 * - Never exposes API keys, OAuth secrets, or database credentials in client code.
 * - Clearly distinguishes demonstration sandbox operations from live backend persistence.
 */

export interface DjangoEndpointContract {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  csrfRequired: boolean;
  authScope: string;
}

export const DJANGO_API_CONTRACTS: DjangoEndpointContract[] = [
  {
    method: 'POST',
    path: '/api/v1/auth/google/verify/',
    description: 'Verifies Google Identity OAuth token server-side and links or resolves authenticated user session.',
    csrfRequired: true,
    authScope: 'Public / Session Init',
  },
  {
    method: 'GET',
    path: '/api/v1/patients/me/',
    description: 'Retrieves authenticated patient profile and authorized medical history fields.',
    csrfRequired: false,
    authScope: 'Authenticated Patient',
  },
  {
    method: 'PATCH',
    path: '/api/v1/patients/me/',
    description: 'Updates permitted patient profile and medical intake fields with server-side validation.',
    csrfRequired: true,
    authScope: 'Authenticated Patient',
  },
  {
    method: 'GET',
    path: '/api/v1/availability/doctors/:doctorId/?date=YYYY-MM-DD',
    description: 'Computes real-time 1-hour slot availability from Neon PostgreSQL without exposing other patient data.',
    csrfRequired: false,
    authScope: 'Authenticated User',
  },
  {
    method: 'POST',
    path: '/api/v1/appointments/book/',
    description: 'Executes transaction-safe SELECT FOR UPDATE slot reservation to prevent double-booking.',
    csrfRequired: true,
    authScope: 'Authenticated Patient',
  },
  {
    method: 'POST',
    path: '/api/v1/appointments/:id/transition/',
    description: 'Performs authorized state transition (Confirm, Reject, Reschedule, Cancel, Complete) and dispatches notifications.',
    csrfRequired: true,
    authScope: 'Role-Verified Actor (Patient / Doctor / Admin)',
  },
  {
    method: 'PUT',
    path: '/api/v1/doctors/:id/schedule/',
    description: 'Updates working hours, breaks, or leave blocks after checking for confirmed booking conflicts.',
    csrfRequired: true,
    authScope: 'Authenticated Doctor / Admin',
  },
];

export async function simulateNetworkDelay(ms = 260): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function validateSlotCanBeBooked(
  availability: DoctorAvailability,
  slotStartTime: string
): { valid: boolean; error?: string } {
  if (availability.dayStatus === 'Past') {
    return { valid: false, error: 'Past dates cannot be booked. Please choose a current or future date.' };
  }
  if (availability.dayStatus === 'Blocked / Leave' || availability.dayStatus === 'Doctor Unavailable') {
    return { valid: false, error: 'The selected doctor is unavailable on this date. Please select an open date.' };
  }
  const slot = availability.slots.find((s) => s.startTime === slotStartTime);
  if (!slot) {
    return { valid: false, error: 'Selected time slot is outside configured clinic working hours.' };
  }
  if (slot.status !== 'Available') {
    return {
      valid: false,
      error: `Slot ${slot.label} is currently ${slot.status.toLowerCase()}. To prevent double-booking, please choose an available 1-hour slot.`,
    };
  }
  return { valid: true };
}

export function getAllowedStatusTransitions(
  currentStatus: AppointmentStatus,
  actorRole: 'patient' | 'doctor' | 'admin'
): AppointmentStatus[] {
  if (currentStatus === 'Completed' || currentStatus === 'Cancelled' || currentStatus === 'Rejected') {
    return [];
  }

  if (actorRole === 'patient') {
    if (currentStatus === 'Pending' || currentStatus === 'Confirmed' || currentStatus === 'Rescheduled') {
      return ['Reschedule Requested', 'Cancelled'];
    }
    if (currentStatus === 'Reschedule Requested') {
      return ['Cancelled'];
    }
    return [];
  }

  if (actorRole === 'doctor') {
    if (currentStatus === 'Pending') {
      return ['Confirmed', 'Rejected', 'Rescheduled'];
    }
    if (currentStatus === 'Confirmed' || currentStatus === 'Rescheduled') {
      return ['Completed', 'Rescheduled', 'Cancelled'];
    }
    if (currentStatus === 'Reschedule Requested') {
      return ['Rescheduled', 'Confirmed', 'Cancelled'];
    }
    return [];
  }

  if (actorRole === 'admin') {
    if (currentStatus === 'Pending') {
      return ['Confirmed', 'Rejected', 'Rescheduled', 'Cancelled'];
    }
    if (currentStatus === 'Confirmed' || currentStatus === 'Reschedule Requested' || currentStatus === 'Rescheduled') {
      return ['Confirmed', 'Rescheduled', 'Completed', 'Cancelled'];
    }
  }

  return [];
}

export function generateAppointmentReference(existingAppointments: Appointment[]): string {
  const base = 8500 + existingAppointments.length + 1;
  return `TH-2026-${base}`;
}
