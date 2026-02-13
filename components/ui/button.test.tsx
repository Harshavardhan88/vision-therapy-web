import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./button";

describe("Button Component", () => {
    it("renders correctly with default props", () => {
        render(<Button>Click me</Button>);
        const button = screen.getByRole("button", { name: "Click me" });
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass("bg-blue-600");
    });

    it("renders the danger variant correctly", () => {
        render(<Button variant="danger">Delete</Button>);
        const button = screen.getByRole("button", { name: "Delete" });
        expect(button).toHaveClass("bg-red-600");
    });

    it("handles onClick events", () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick}>Click me</Button>);
        const button = screen.getByRole("button", { name: "Click me" });
        fireEvent.click(button);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("shows loading spinner when isLoading is true", () => {
        render(<Button isLoading>Login</Button>);
        const button = screen.getByRole("button");
        expect(button).toBeDisabled();
        expect(screen.getByTestId("icon-Loader2")).toBeInTheDocument(); // Check for our Mock Icon
    });

    it("matches UI snapshot", () => {
        const { container } = render(<Button variant="gamified">Snapshot Me</Button>);
        expect(container).toMatchSnapshot();
    });

    it("has no accessibility violations", async () => {
        const { axe, toHaveNoViolations } = require('jest-axe'); // Dynamic require to avoid TS import issues
        const { container } = render(<Button>Accessible</Button>);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
