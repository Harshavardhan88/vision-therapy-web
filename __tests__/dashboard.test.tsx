import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ParentDashboard from '@/app/dashboard/parent/page';

// Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/lib/api', () => ({
    auth: {
        getMe: jest.fn().mockResolvedValue({ data: { full_name: "Test Parent" } }),
        getParentChildren: jest.fn().mockResolvedValue({ data: [{ id: 1, full_name: "Test Child", email: "child@test.com" }] }),
        getSessions: jest.fn().mockResolvedValue({ data: [] }),
        getDoctorNotes: jest.fn().mockResolvedValue({
            data: [{ id: 1, note_type: "suggestion", content: "Test Note Content", created_at: "2023-01-01" }]
        }),
    }
}));

describe('ParentDashboard', () => {
    it('renders parent name and doctor notes', async () => {
        // This is an async component in Next.js app router usually, but we are testing the client component logic.
        // We need to wrap in act() or just wait for effects.

        // Note: Since we are using standard Jest/RTL, testing async useEffect can be tricky 
        // without `waitFor`.

        // For now, let's just create a basic render test.
        // In a real App Router setup, page.tsx might be Client Component.
        // Check file content: "use client" is present.

        const { findByText } = render(<ParentDashboard />);

        expect(await findByText('Parent Dashboard')).toBeInTheDocument();
        expect(await findByText('Welcome back,')).toBeInTheDocument();

        // Check for note
        expect(await findByText('"Test Note Content"')).toBeInTheDocument();
    });
});
