import { z } from 'zod';

export const ArrivalIntentEnum = z.enum([
  'GUEST',
  'DELIVERY',
  'SERVICE',
  'PICKUP',
  'UNMATCHED'
]);

export const ArrivalIntentSchema = ArrivalIntentEnum;

export type ArrivalIntent = z.infer<typeof ArrivalIntentEnum>;


export const ArrivalIntentLabels: Record<ArrivalIntent, { title: string; description: string; badgeVariant: string }> = {
  GUEST: {
    title: 'Guest',
    description: 'Scheduled visitor, candidate, client, or meeting attendee',
    badgeVariant: 'signal'
  },
  DELIVERY: {
    title: 'Delivery',
    description: 'Courier, parcel drop-off, or freight arrival',
    badgeVariant: 'brass'
  },
  SERVICE: {
    title: 'Service',
    description: 'Contractor, technician, maintenance, or facilities visit',
    badgeVariant: 'brass'
  },
  PICKUP: {
    title: 'Pickup',
    description: 'Scheduled outgoing parcel, catering return, or equipment pickup',
    badgeVariant: 'moss'
  },
  UNMATCHED: {
    title: 'Unmatched',
    description: 'No matching scheduled arrival, delivery, or service visit found',
    badgeVariant: 'ember'
  }
};
