import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  describe("Rendering", () => {
    it("renders an input element", () => {
      render(<Input />);

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("renders with placeholder text", () => {
      render(<Input placeholder="Enter your name" />);

      const input = screen.getByPlaceholderText("Enter your name");
      expect(input).toBeInTheDocument();
    });

    it("renders with data-slot attribute", () => {
      render(<Input />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("data-slot", "input");
    });

    it("renders with default styling classes", () => {
      render(<Input />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("h-9");
      expect(input).toHaveClass("w-full");
      expect(input).toHaveClass("rounded-md");
      expect(input).toHaveClass("border");
    });
  });

  describe("Input Types", () => {
    it("renders as text input by default", () => {
      render(<Input />);

      // When type is not specified, input defaults to text (HTML default)
      // The textbox role confirms it behaves as a text input
      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
      // Type attribute is either "text" or undefined (HTML defaults to text)
      const typeAttr = input.getAttribute("type");
      expect(typeAttr === "text" || typeAttr === null).toBe(true);
    });

    it("renders as email input", () => {
      render(<Input type="email" placeholder="Email" />);

      const input = screen.getByPlaceholderText("Email");
      expect(input).toHaveAttribute("type", "email");
    });

    it("renders as password input", () => {
      render(<Input type="password" data-testid="password-input" />);

      const input = screen.getByTestId("password-input");
      expect(input).toHaveAttribute("type", "password");
    });

    it("renders as number input", () => {
      render(<Input type="number" placeholder="Amount" />);

      const input = screen.getByPlaceholderText("Amount");
      expect(input).toHaveAttribute("type", "number");
    });

    it("renders as search input", () => {
      render(<Input type="search" placeholder="Search..." />);

      const input = screen.getByPlaceholderText("Search...");
      expect(input).toHaveAttribute("type", "search");
    });

    it("renders as tel input", () => {
      render(<Input type="tel" placeholder="Phone number" />);

      const input = screen.getByPlaceholderText("Phone number");
      expect(input).toHaveAttribute("type", "tel");
    });
  });

  describe("Change Events", () => {
    it("handles onChange events", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "Hello");

      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(5); // Once per character
    });

    it("updates value when typing", async () => {
      const user = userEvent.setup();

      render(<Input />);

      const input = screen.getByRole("textbox");
      await user.type(input, "Test value");

      expect(input).toHaveValue("Test value");
    });

    it("handles fireEvent change correctly", () => {
      const handleChange = vi.fn();

      render(<Input onChange={handleChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "New value" } });

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(input).toHaveValue("New value");
    });

    it("provides event object with correct value", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "a");

      expect(handleChange).toHaveBeenCalled();
      const event = handleChange.mock.calls[0][0];
      expect(event.target.value).toBe("a");
    });
  });

  describe("Error/Invalid State", () => {
    it("supports aria-invalid attribute", () => {
      render(<Input aria-invalid="true" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("applies error styling classes for aria-invalid", () => {
      render(<Input aria-invalid="true" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("aria-invalid:border-destructive");
    });

    it("supports aria-errormessage for error description", () => {
      render(
        <>
          <Input aria-invalid="true" aria-errormessage="error-msg" />
          <span id="error-msg">This field is required</span>
        </>
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-errormessage", "error-msg");
    });

    it("supports aria-describedby for additional context", () => {
      render(
        <>
          <Input aria-describedby="help-text" />
          <span id="help-text">Enter at least 8 characters</span>
        </>
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-describedby", "help-text");
    });
  });

  describe("Focus and Blur Events", () => {
    it("handles onFocus events", async () => {
      const handleFocus = vi.fn();
      const user = userEvent.setup();

      render(<Input onFocus={handleFocus} />);

      const input = screen.getByRole("textbox");
      await user.click(input);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it("handles onBlur events", async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup();

      render(<Input onBlur={handleBlur} />);

      const input = screen.getByRole("textbox");
      await user.click(input);
      await user.tab(); // Move focus away

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it("can receive focus via tab", async () => {
      const user = userEvent.setup();

      render(<Input />);

      const input = screen.getByRole("textbox");
      await user.tab();

      expect(input).toHaveFocus();
    });

    it("has focus-visible ring styles", () => {
      render(<Input />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("focus-visible:ring-ring/50");
      expect(input).toHaveClass("focus-visible:border-ring");
    });

    it("handles fireEvent focus and blur", () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();

      render(<Input onFocus={handleFocus} onBlur={handleBlur} />);

      const input = screen.getByRole("textbox");

      fireEvent.focus(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);

      fireEvent.blur(input);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe("Controlled Value", () => {
    it("works with controlled value", () => {
      const { rerender } = render(<Input value="initial" onChange={() => {}} />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("initial");

      rerender(<Input value="updated" onChange={() => {}} />);
      expect(input).toHaveValue("updated");
    });

    it("calls onChange when controlled input changes", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input value="controlled" onChange={handleChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "x");

      expect(handleChange).toHaveBeenCalled();
    });

    it("does not change value without onChange handler updating it", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input value="locked" onChange={handleChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      // Value stays locked because onChange doesn't update state
      expect(input).toHaveValue("locked");
    });

    it("works with empty controlled value", () => {
      render(<Input value="" onChange={() => {}} />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("");
    });
  });

  describe("Disabled State", () => {
    it("can be disabled", () => {
      render(<Input disabled />);

      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("has disabled styling classes", () => {
      render(<Input disabled />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("disabled:opacity-50");
      expect(input).toHaveClass("disabled:pointer-events-none");
    });

    it("does not fire onChange when disabled", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input disabled onChange={handleChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("Read-Only State", () => {
    it("can be read-only", () => {
      render(<Input readOnly value="Read only text" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("readOnly");
      expect(input).toHaveValue("Read only text");
    });

    it("does not change value when read-only", async () => {
      const user = userEvent.setup();

      render(<Input readOnly value="Unchangeable" />);

      const input = screen.getByRole("textbox");
      await user.type(input, "new text");

      expect(input).toHaveValue("Unchangeable");
    });
  });

  describe("Custom ClassName", () => {
    it("applies custom className", () => {
      render(<Input className="custom-input-class" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("custom-input-class");
    });

    it("merges custom className with default classes", () => {
      render(<Input className="my-custom-style" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("my-custom-style");
      expect(input).toHaveClass("w-full");
      expect(input).toHaveClass("rounded-md");
    });
  });

  describe("Accessibility", () => {
    it("supports id attribute for label association", () => {
      render(
        <>
          <label htmlFor="test-input">Test Label</label>
          <Input id="test-input" />
        </>
      );

      const input = screen.getByLabelText("Test Label");
      expect(input).toBeInTheDocument();
    });

    it("supports aria-label", () => {
      render(<Input aria-label="Search input" />);

      const input = screen.getByRole("textbox", { name: "Search input" });
      expect(input).toBeInTheDocument();
    });

    it("supports aria-labelledby", () => {
      render(
        <>
          <span id="label-id">External Label</span>
          <Input aria-labelledby="label-id" />
        </>
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-labelledby", "label-id");
    });

    it("supports required attribute", () => {
      render(<Input required />);

      const input = screen.getByRole("textbox");
      expect(input).toBeRequired();
    });

    it("supports aria-required", () => {
      render(<Input aria-required="true" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-required", "true");
    });
  });

  describe("HTML Attributes", () => {
    it("supports name attribute", () => {
      render(<Input name="username" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("name", "username");
    });

    it("supports maxLength attribute", () => {
      render(<Input maxLength={10} />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("maxLength", "10");
    });

    it("supports minLength attribute", () => {
      render(<Input minLength={5} />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("minLength", "5");
    });

    it("supports pattern attribute", () => {
      render(<Input pattern="[A-Za-z]+" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("pattern", "[A-Za-z]+");
    });

    it("supports autoComplete attribute", () => {
      render(<Input autoComplete="email" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("autoComplete", "email");
    });

    it("supports autoFocus attribute", () => {
      render(<Input autoFocus />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveFocus();
    });
  });
});
