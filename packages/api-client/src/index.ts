import type {
  CreateBatchInput,
  CreateFeePlanInput,
  CreateStudentInput,
  LoginInput,
  MarkAttendanceInput,
  RecordPaymentInput,
  RegisterTenantInput,
} from "@tutionassist/shared";

export interface ApiClientOptions {
  baseUrl: string;
  getToken?: () => string | null | undefined;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function createApiClient({ baseUrl, getToken }: ApiClientOptions) {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = getToken?.();
    const res = await fetch(`${baseUrl}/api/v1${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new ApiError(
        res.status,
        String(data.code ?? "ERROR"),
        String(data.message ?? res.statusText),
      );
    }
    return data as T;
  }

  return {
    auth: {
      registerTenant: (input: RegisterTenantInput) =>
        request<{ token: string }>("POST", "/auth/register-tenant", input),
      login: (input: LoginInput) => request<{ token: string }>("POST", "/auth/login", input),
      me: () => request<{ userId: string; tenantId: string; role: string }>("GET", "/auth/me"),
    },
    batches: {
      list: () => request<{ items: unknown[] }>("GET", "/batches"),
      create: (input: CreateBatchInput) => request<unknown>("POST", "/batches", input),
    },
    students: {
      list: () => request<{ items: unknown[] }>("GET", "/students"),
      create: (input: CreateStudentInput) => request<unknown>("POST", "/students", input),
    },
    attendance: {
      mark: (input: MarkAttendanceInput) => request<unknown>("POST", "/attendance", input),
      summary: (batchId: string) =>
        request<{ items: unknown[] }>("GET", `/attendance/batches/${batchId}/summary`),
    },
    fees: {
      createPlan: (input: CreateFeePlanInput) => request<unknown>("POST", "/fees/plans", input),
      generate: (planId: string, period: string) =>
        request<unknown>("POST", `/fees/plans/${planId}/generate`, { period }),
      list: (query?: { status?: string; batchId?: string }) => {
        const qs = new URLSearchParams(query as Record<string, string>).toString();
        return request<{ items: unknown[] }>("GET", `/fees${qs ? `?${qs}` : ""}`);
      },
      reminder: (feeRecordId: string) =>
        request<{ waLink: string; upiUri: string; message: string }>(
          "POST",
          `/fees/${feeRecordId}/reminder`,
        ),
      recordPayment: (feeRecordId: string, input: RecordPaymentInput) =>
        request<unknown>("POST", `/fees/${feeRecordId}/payments`, input),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
