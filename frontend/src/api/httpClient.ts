import ENV from '../config/env';
import { getToken } from '../auth/tokenStorage';

export interface ApiError{
    message: string;
    status?: number;
    code?: string;
    errors?: unknown;
}

export function isApiError(e: unknown): e is ApiError{
    return(
        typeof e === 'object' &&
        e !== null &&
        'message' in e &&
        typeof (e as any).message === 'string'
    );
}

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