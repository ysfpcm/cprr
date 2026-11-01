export type Service = {
  id: string;
  name: string;
  price: string;
  description: string;
  simplybookId: number;
  availableFrom?: string;
}

export const services: Service[] = [
  {
    id: "bls",
    name: "BLS for Healthcare Providers (American Heart Association Compliant)",
    price: "$75 per person",
    description: "Basic Life Support for healthcare professionals; high‑quality CPR, airway & team‑based skills.",
    simplybookId: 2
  },
  {
    id: "cpr-non-healthcare",
    name: "CPR (Only) Certification for Non-Healthcare Personnel",
    price: "$65 per person",
    description: "Essential CPR training for laypersons, workplace safety, and community emergency preparedness. Covers adult, child, and infant CPR with AED training.",
    simplybookId: 9
  },
  {
    id: "first-aid",
    name: "First Aid Certification",
    price: "$95 per person",
    description: "Covers bleeding, burns, fractures, scene safety & emergency action steps. Two‑year certification.",
    simplybookId: 4
  },
  {
    id: "cpr-first-aid",
    name: "CPR & First Aid Certification",
    price: "$130 per person",
    description: "Combined CPR (Adult/Child/Infant/AED) & First Aid. Two‑year certification.",
    simplybookId: 3
  },
  {
    id: "babysitter",
    name: "Babysitter Course (two‑day program)",
    price: "$165 total",
    description: "Two‑day babysitter training — lunch & snacks provided — includes Child/Infant CPR & First Aid certification cards.",
    simplybookId: 5
  },
  {
    id: "acls",
    name: "Advanced Cardiac Life Support (ACLS)",
    price: "$145 per person",
    description: "Advanced resuscitation for healthcare providers: medications, airway management & defibrillation; builds on BLS skills.",
    simplybookId: 6,
    availableFrom: "2025-07-14"
  },
  {
    id: "pals",
    name: "Pediatric Advanced Life Support (PALS)",
    price: "$145 per person",
    description: "Advanced pediatric emergency care: assessment, rhythms, interventions & pediatric medication administration.",
    simplybookId: 7,
    availableFrom: "2025-07-14"
  },
  {
    id: "test",
    name: "Test Payment",
    price: "$0.50 per person",
    description: "For testing payment integration only.",
    simplybookId: 8
  },
]

export function getSimplybookEventIdForService(serviceName: string): number | undefined {
  return services.find(service => service.name.toLowerCase() === serviceName.toLowerCase())?.simplybookId;
}
