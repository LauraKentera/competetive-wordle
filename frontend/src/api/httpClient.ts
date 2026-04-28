import ENV from '../config/env';
import { getToken } from '../auth/tokenStorage';

/** Represents a structured API error returned from the backend. */
export interface ApiError{
    message: string;
    status?: number;
    code?: string;
    errors?: unknown;
}

/**
 * Type guard that checks whether an unknown value is an ApiError.
 *
 * @param e - The value to check.
 * @returns True if the value conforms to the ApiError shape.
 */
export function isApiError(e: unknown): e is ApiError{
    return(
        typeof e === 'object' &&
        e !== null &&
        'message' in e &&
        typeof (e as any).message === 'string'
    );
}

/**
 * Sends an authenticated HTTP request to the backend API.
 * Automatically attaches the JWT Bearer token from storage and sets
 * Content-Type to application/json for mutating requests.
 *
 * @param path - The API path to call (e.g. "/api/me").
 * @param options - Optional fetch RequestInit overrides (method, body, headers, etc.).
 * @returns A promise that resolves to the parsed response body of type T.
 * @throws {ApiError} If the response status is not OK.
 */
export async function request<T = unknown>(
    path: string,
    options: RequestInit = {}
): Promise<T>{
    const url = `${ENV.API_BASE_URL}${path}`;

    const token = getToken();

    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
    };

    if(token){
        headers['Authorization'] = `Bearer ${token}`;
    }

    const method = (options.method || 'GET').toUpperCase();
    if(['POST', 'PUT', 'PATCH'].includes(method)){
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    let data: any = null;
    try{
        data = await response.json();
    }catch{
        //ignore if no body
    }

    if(!response.ok){
        const error: ApiError = {
            message: data?.message || 'Request failed',
            status: response.status,
            code: data?.code,
            errors: data?.errors,
        };

        throw error;
    }

    return data as T;
}