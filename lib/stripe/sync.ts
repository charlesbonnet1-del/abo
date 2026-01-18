// Stripe sync functions - stub implementation
// These will be implemented when database integration is added

export async function syncStripeData(userId: string, accessToken: string) {
  console.log(`[Stub] syncStripeData called for user ${userId}, hasToken: ${!!accessToken}`);
  // TODO: Implement when database is configured
}

export async function syncSingleCustomer(
  userId: string,
  accessToken: string,
  customerId: string
) {
  console.log(`[Stub] syncSingleCustomer called for user ${userId}, customer ${customerId}, hasToken: ${!!accessToken}`);
  // TODO: Implement when database is configured
}
