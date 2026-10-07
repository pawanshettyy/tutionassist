export function withTenant<T>(_tenantId: string, operation: () => Promise<T>) {
  return operation();
}
