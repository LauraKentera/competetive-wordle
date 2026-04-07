import { request  } from "./httpClient";
import * as tokenStorage from '../auth/tokenStorage';

jest.mock('../auth/tokenStorage', () => ({
    getToken: jest.fn(),
}));

describe('httpClient request', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
        (tokenStorage.getToken as jest.Mock).mockReturnValue(null);
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('throws parsed ApiError from 401 JSON response', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 401,
            json: jest.fn().mockResolvedValue({
                message: 'Invalid credentials',
                code: 'AUTH_401',
                errors: { username: 'Unknown user' },
            }),
        } as Partial<Response>);

        await expect(request('/auth/login')).rejects.toMatchObject({
            message: 'Invalid credentials',
            status: 401,
            code: 'AUTH_401',
            errors: { username: 'Unknown user' },
        });
    });
});