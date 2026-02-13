import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderHook, act } from '@testing-library/react';
import {
    useKeyboardShortcuts,
    useFocusTrap,
    useArrowNavigation,
    announceToScreenReader
} from '@/lib/accessibility';
import {
    AccessibilityProvider,
    useAccessibility
} from '@/contexts/AccessibilityContext';
import {
    AccessibleButton,
    AccessibleInput,
    AccessibleProgress,
    AccessibleAlert
} from '@/components/ui/AccessibleComponents';

describe('Phase 4: Accessibility Features', () => {
    describe('Keyboard Navigation', () => {
        test('useKeyboardShortcuts registers shortcuts', () => {
            const action = jest.fn();
            const shortcuts = [
                {
                    key: 's',
                    ctrl: true,
                    description: 'Save',
                    action
                }
            ];

            renderHook(() => useKeyboardShortcuts(shortcuts));

            // Simulate Ctrl+S
            const event = new KeyboardEvent('keydown', {
                key: 's',
                ctrlKey: true
            });
            window.dispatchEvent(event);

            expect(action).toHaveBeenCalled();
        });

        test('useArrowNavigation navigates with arrows', () => {
            const onSelect = jest.fn();
            const { result } = renderHook(() =>
                useArrowNavigation(5, onSelect, 0)
            );

            expect(result.current).toBe(0);

            // Simulate arrow down
            const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            window.dispatchEvent(event);

            expect(onSelect).toHaveBeenCalledWith(1);
        });
    });

    describe('Accessibility Context', () => {
        test('provides default settings', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AccessibilityProvider>{children}</AccessibilityProvider>
            );

            const { result } = renderHook(() => useAccessibility(), { wrapper });

            expect(result.current.settings).toHaveProperty('highContrast');
            expect(result.current.settings).toHaveProperty('fontSize');
            expect(result.current.settings.fontSize).toBe('medium');
        });

        test('updates settings', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AccessibilityProvider>{children}</AccessibilityProvider>
            );

            const { result } = renderHook(() => useAccessibility(), { wrapper });

            act(() => {
                result.current.updateSettings({ highContrast: true });
            });

            expect(result.current.settings.highContrast).toBe(true);
        });

        test('persists settings to localStorage', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AccessibilityProvider>{children}</AccessibilityProvider>
            );

            const { result } = renderHook(() => useAccessibility(), { wrapper });

            act(() => {
                result.current.updateSettings({ fontSize: 'large' });
            });

            const saved = localStorage.getItem('accessibility-settings');
            expect(saved).toContain('large');
        });
    });

    describe('Accessible Components', () => {
        test('AccessibleButton has proper ARIA attributes', () => {
            render(
                <AccessibleButton
                    ariaLabel="Start game"
                    ariaPressed={false}
                    onClick={() => { }}
                >
                    Start
                </AccessibleButton>
            );

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-label', 'Start game');
            expect(button).toHaveAttribute('aria-pressed', 'false');
        });

        test('AccessibleInput has associated label', () => {
            render(
                <AccessibleInput
                    label="Username"
                    value=""
                    onChange={() => { }}
                />
            );

            const input = screen.getByLabelText('Username');
            expect(input).toBeInTheDocument();
        });

        test('AccessibleInput shows error with aria-invalid', () => {
            render(
                <AccessibleInput
                    label="Email"
                    value=""
                    onChange={() => { }}
                    error="Invalid email"
                />
            );

            const input = screen.getByLabelText('Email');
            expect(input).toHaveAttribute('aria-invalid', 'true');
            expect(screen.getByText('Invalid email')).toBeInTheDocument();
        });

        test('AccessibleProgress has progressbar role', () => {
            render(
                <AccessibleProgress
                    value={50}
                    max={100}
                    label="Loading"
                />
            );

            const progress = screen.getByRole('progressbar');
            expect(progress).toHaveAttribute('aria-valuenow', '50');
            expect(progress).toHaveAttribute('aria-valuemax', '100');
        });

        test('AccessibleAlert has correct role', () => {
            render(
                <AccessibleAlert
                    type="error"
                    message="Something went wrong"
                />
            );

            const alert = screen.getByRole('alert');
            expect(alert).toBeInTheDocument();
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        });

        test('AccessibleAlert can be dismissed', () => {
            const onDismiss = jest.fn();
            render(
                <AccessibleAlert
                    type="info"
                    message="Info message"
                    onDismiss={onDismiss}
                />
            );

            const dismissButton = screen.getByLabelText('Dismiss alert');
            fireEvent.click(dismissButton);
            expect(onDismiss).toHaveBeenCalled();
        });
    });

    describe('Screen Reader Support', () => {
        test('announceToScreenReader creates live region', () => {
            announceToScreenReader('Test announcement', 'polite');

            const announcement = document.querySelector('[role="status"]');
            expect(announcement).toBeInTheDocument();
            expect(announcement).toHaveTextContent('Test announcement');
            expect(announcement).toHaveAttribute('aria-live', 'polite');
        });

        test('assertive announcements use correct aria-live', () => {
            announceToScreenReader('Urgent message', 'assertive');

            const announcement = document.querySelector('[aria-live="assertive"]');
            expect(announcement).toBeInTheDocument();
        });
    });

    describe('Focus Management', () => {
        test('useFocusTrap traps focus in container', () => {
            const TestComponent = () => {
                const containerRef = React.useRef<HTMLDivElement>(null);
                useFocusTrap(containerRef, true);

                return (
                    <div ref={containerRef}>
                        <button>First</button>
                        <button>Second</button>
                        <button>Last</button>
                    </div>
                );
            };

            render(<TestComponent />);

            const buttons = screen.getAllByRole('button');
            expect(document.activeElement).toBe(buttons[0]);
        });
    });

    describe('Color Blind Modes', () => {
        test('applies color blind filter to document', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AccessibilityProvider>{children}</AccessibilityProvider>
            );

            const { result } = renderHook(() => useAccessibility(), { wrapper });

            act(() => {
                result.current.updateSettings({ colorBlindMode: 'protanopia' });
            });

            expect(document.documentElement.getAttribute('data-colorblind-mode')).toBe('protanopia');
        });
    });

    describe('High Contrast Mode', () => {
        test('applies high contrast class', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AccessibilityProvider>{children}</AccessibilityProvider>
            );

            const { result } = renderHook(() => useAccessibility(), { wrapper });

            act(() => {
                result.current.updateSettings({ highContrast: true });
            });

            expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
        });
    });

    describe('Font Size Controls', () => {
        test('applies font size attribute', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AccessibilityProvider>{children}</AccessibilityProvider>
            );

            const { result } = renderHook(() => useAccessibility(), { wrapper });

            act(() => {
                result.current.updateSettings({ fontSize: 'large' });
            });

            expect(document.documentElement.getAttribute('data-font-size')).toBe('large');
        });
    });
});
