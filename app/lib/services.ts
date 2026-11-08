export type Service = {
  id: string;
  name: string;
  priceCents: number;
  pricePerPerson: boolean;
  description: string;
  simplybookId: number;
  availableFrom?: string;
}

export const services: Service[] = [
  {
    id: "bls",
    name: "BLS for Healthcare Providers (American Heart Association Compliant)",
    priceCents: 7500,
    pricePerPerson: true,
    description: "Basic Life Support for healthcare professionals; high‑quality CPR, airway & team‑based skills.",
    simplybookId: 2
  },
  {
    id: "cpr-non-healthcare",
    name: "CPR (Only) Certification for Non-Healthcare Personnel",
    priceCents: 6500,
    pricePerPerson: true,
    description: "Essential CPR training for laypersons, workplace safety, and community emergency preparedness. Covers adult, child, and infant CPR with AED training.",
    simplybookId: 9
  },
  {
    id: "first-aid",
    name: "First Aid Certification",
    priceCents: 9500,
    pricePerPerson: true,
    description: "Covers bleeding, burns, fractures, scene safety & emergency action steps. Two‑year certification.",
    simplybookId: 4
  },
  {
    id: "cpr-first-aid",
    name: "CPR & First Aid Certification",
    priceCents: 13000,
    pricePerPerson: true,
    description: "Combined CPR (Adult/Child/Infant/AED) & First Aid. Two‑year certification.",
    simplybookId: 3
  },
  {
    id: "babysitter",
    name: "Babysitter Course (two‑day program)",
    priceCents: 16500,
    pricePerPerson: false,
    description: "Two‑day babysitter training — lunch & snacks provided — includes Child/Infant CPR & First Aid certification cards.",
    simplybookId: 5
  },
  {
    id: "acls",
    name: "Advanced Cardiac Life Support (ACLS)",
    priceCents: 14500,
    pricePerPerson: true,
    description: "Advanced resuscitation for healthcare providers: medications, airway management & defibrillation; builds on BLS skills.",
    simplybookId: 6,
    availableFrom: "2025-07-14"
  },
  {
    id: "pals",
    name: "Pediatric Advanced Life Support (PALS)",
    priceCents: 14500,
    pricePerPerson: true,
    description: "Advanced pediatric emergency care: assessment, rhythms, interventions & pediatric medication administration.",
    simplybookId: 7,
    availableFrom: "2025-07-14"
  },
  {
    id: "test",
    name: "Test Payment",
    priceCents: 50,
    pricePerPerson: true,
    description: "For testing payment integration only.",
    simplybookId: 8
  },
]

export function formatServicePrice(service: Service): string {
  const dollars = service.priceCents / 100;
  const price = Number.isInteger(dollars) ? dollars.toString() : dollars.toFixed(2);
  return `$${price} ${service.pricePerPerson ? 'per person' : 'total'}`;
}

export function getServiceTotalCents(service: Service, participants: number): number {
  return service.priceCents * (service.pricePerPerson ? participants : 1);
}

export function getSimplybookEventIdForService(serviceName: string): number | undefined {
  return services.find(service => service.name.toLowerCase() === serviceName.toLowerCase())?.simplybookId;
}
