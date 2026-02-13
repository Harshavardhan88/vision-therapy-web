import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
    LoadingSpinner,
    GameLoadingScreen,
    SkeletonLoader,
    PageTransition
} from '@/components/ui/LoadingStates';
import {
    Tooltip,
    HelpIcon,
    InfoBanner,
    FeatureHighlight
} from '@/components/ui/Tooltips';
import {
    ToggleSwitch,
    Slider,
    DifficultySelector,
    EyeSelector
} from '@/components/ui/SettingsControls';

describe('Phase 2: UI/UX Components', () => {
    describe('LoadingStates', () => {
        test('LoadingSpinner renders with correct size', () => {
            const { container } = render(<LoadingSpinner size="lg" color="cyan" />);
            const spinner = container.querySelector('div');
            expect(spinner).toHaveClass('w-12', 'h-12');
        });

        test('GameLoadingScreen shows progress', () => {
            render(
                <GameLoadingScreen
                    gameName="Balloon Pop"
                    progress={75}
                    message="Loading assets"
                />
            );
            expect(screen.getByText('Balloon Pop')).toBeInTheDocument();
            expect(screen.getByText(/Loading assets/)).toBeInTheDocument();
        });

        test('SkeletonLoader renders with correct variant', () => {
            const { container } = render(<SkeletonLoader variant="circular" />);
            const skeleton = container.querySelector('div');
            expect(skeleton).toHaveClass('rounded-full');
        });

        test('PageTransition animates on mount', () => {
            const { container } = render(
                <PageTransition>
                    <div>Content</div>
                </PageTransition>
            );
            expect(screen.getByText('Content')).toBeInTheDocument();
        });
    });

    describe('Tooltips', () => {
        test('Tooltip shows on hover', async () => {
            render(
                <Tooltip content="Help text" position="top">
                    <button>Hover me</button>
                </Tooltip>
            );

            const button = screen.getByText('Hover me');
            fireEvent.mouseEnter(button);

            await waitFor(() => {
                expect(screen.getByText('Help text')).toBeInTheDocument();
            }, { timeout: 500 });
        });

        test('HelpIcon renders with correct size', () => {
            render(<HelpIcon content="Help" size="md" />);
            const icon = screen.getByLabelText('Help');
            expect(icon).toBeInTheDocument();
        });

        test('InfoBanner can be dismissed', () => {
            const onDismiss = jest.fn();
            render(
                <InfoBanner
                    type="info"
                    message="Test message"
                    onDismiss={onDismiss}
                />
            );

            const dismissButton = screen.getByLabelText('Dismiss');
            fireEvent.click(dismissButton);
            expect(onDismiss).toHaveBeenCalled();
        });

        test('FeatureHighlight shows NEW badge', () => {
            render(
                <FeatureHighlight label="NEW">
                    <button>Feature</button>
                </FeatureHighlight>
            );
            expect(screen.getByText('NEW')).toBeInTheDocument();
        });
    });

    describe('SettingsControls', () => {
        test('ToggleSwitch toggles on click', () => {
            const onChange = jest.fn();
            render(
                <ToggleSwitch
                    label="Enable VR"
                    checked={false}
                    onChange={onChange}
                />
            );

            const toggle = screen.getByRole('switch');
            fireEvent.click(toggle);
            expect(onChange).toHaveBeenCalledWith(true);
        });

        test('Slider updates value', () => {
            const onChange = jest.fn();
            render(
                <Slider
                    label="Opacity"
                    value={50}
                    onChange={onChange}
                    min={0}
                    max={100}
                />
            );

            const slider = screen.getByRole('slider');
            fireEvent.change(slider, { target: { value: '75' } });
            expect(onChange).toHaveBeenCalledWith(75);
        });

        test('DifficultySelector selects difficulty', () => {
            const onChange = jest.fn();
            render(
                <DifficultySelector
                    value="easy"
                    onChange={onChange}
                />
            );

            const mediumButton = screen.getByText('Medium');
            fireEvent.click(mediumButton);
            expect(onChange).toHaveBeenCalledWith('medium');
        });

        test('EyeSelector selects eye', () => {
            const onChange = jest.fn();
            render(
                <EyeSelector
                    value="left"
                    onChange={onChange}
                />
            );

            const rightButton = screen.getByText('Right Eye');
            fireEvent.click(rightButton);
            expect(onChange).toHaveBeenCalledWith('right');
        });
    });
});
