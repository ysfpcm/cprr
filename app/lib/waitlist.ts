type WaitlistInquiry = {
  name: string
  email: string
  phone: string
  interest: string
  experience: string
  notification: boolean
}

export function buildWaitlistEmail(inquiry: WaitlistInquiry): string {
  const body = [
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `Phone: ${inquiry.phone}`,
    `Interest: ${inquiry.interest}`,
    `Healthcare experience: ${inquiry.experience}`,
    `Requests email notifications: ${inquiry.notification ? 'Yes' : 'No'}`,
  ].join('\n')

  return `mailto:info@anytimecprhealthservices.com?subject=${encodeURIComponent('ACLS and PALS class inquiry')}&body=${encodeURIComponent(body)}`
}
