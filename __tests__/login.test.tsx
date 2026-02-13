import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from '@/app/login/page';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/api';

// Mock useRouter
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: () => new URLSearchParams(),
}));

// Mock API
jest.mock('@/lib/api', () => ({
    auth: {
        login: jest.fn(),
        getMe: jest.fn(),
    }
}));

describe('Login Page Strict Tests', () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const TestLogin = () => (
        <Suspense fallback={<div>Loading...</div>}>
            <Login />
        </Suspense>
    );

    it('validates empty fields', async () => {
        render(<TestLogin />);

        const submitBtn = screen.getByRole('button', { name: /sign in/i });
        fireEvent.click(submitBtn);

        // If HTML5 validation is present, the handler isn't called.
        // We check that API is NOT called.
        expect(auth.login).not.toHaveBeenCalled();
    });

    it('handles API errors gracefully', async () => {
        (auth.login as jest.Mock).mockRejectedValue({ response: { data: { detail: 'Invalid credentials' } } });

        render(<TestLogin />);

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@test.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });

        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        // Expect error message to appear
        expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    });

    it('redirects on success', async () => {
        (auth.login as jest.Mock).mockResolvedValue({ data: { access_token: 'abc', role: 'patient' } });
        (auth.getMe as jest.Mock).mockResolvedValue({ data: { role: 'patient' } });

        render(<TestLogin />);

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'correct@test.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });

        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/dashboard/patient');
        });
    });
});
