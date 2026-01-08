import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card";

describe("Card", () => {
  describe("Base Card Rendering", () => {
    it("renders children correctly", () => {
      render(
        <Card>
          <span>Card Content</span>
        </Card>
      );

      expect(screen.getByText("Card Content")).toBeInTheDocument();
    });

    it("renders with data-slot attribute", () => {
      render(<Card data-testid="card">Content</Card>);

      const card = screen.getByTestId("card");
      expect(card).toHaveAttribute("data-slot", "card");
    });

    it("has default styling classes", () => {
      render(<Card data-testid="card">Content</Card>);

      const card = screen.getByTestId("card");
      expect(card).toHaveClass("bg-card");
      expect(card).toHaveClass("text-card-foreground");
      expect(card).toHaveClass("rounded-xl");
      expect(card).toHaveClass("border");
      expect(card).toHaveClass("shadow-sm");
    });

    it("applies custom className", () => {
      render(
        <Card className="custom-card-class" data-testid="card">
          Content
        </Card>
      );

      const card = screen.getByTestId("card");
      expect(card).toHaveClass("custom-card-class");
    });

    it("merges custom className with default classes", () => {
      render(
        <Card className="my-custom-style" data-testid="card">
          Content
        </Card>
      );

      const card = screen.getByTestId("card");
      expect(card).toHaveClass("my-custom-style");
      expect(card).toHaveClass("bg-card");
      expect(card).toHaveClass("rounded-xl");
    });

    it("renders multiple children", () => {
      render(
        <Card>
          <span>First</span>
          <span>Second</span>
          <span>Third</span>
        </Card>
      );

      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
      expect(screen.getByText("Third")).toBeInTheDocument();
    });

    it("passes through HTML attributes", () => {
      render(
        <Card data-testid="card" id="my-card" role="article">
          Content
        </Card>
      );

      const card = screen.getByTestId("card");
      expect(card).toHaveAttribute("id", "my-card");
      expect(card).toHaveAttribute("role", "article");
    });
  });

  describe("CardHeader", () => {
    it("renders header content", () => {
      render(
        <Card>
          <CardHeader>Header Content</CardHeader>
        </Card>
      );

      expect(screen.getByText("Header Content")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Card>
          <CardHeader data-testid="header">Header</CardHeader>
        </Card>
      );

      const header = screen.getByTestId("header");
      expect(header).toHaveAttribute("data-slot", "card-header");
    });

    it("has default styling classes", () => {
      render(
        <Card>
          <CardHeader data-testid="header">Header</CardHeader>
        </Card>
      );

      const header = screen.getByTestId("header");
      expect(header).toHaveClass("grid");
      expect(header).toHaveClass("px-6");
    });

    it("applies custom className to header", () => {
      render(
        <Card>
          <CardHeader className="custom-header" data-testid="header">
            Header
          </CardHeader>
        </Card>
      );

      const header = screen.getByTestId("header");
      expect(header).toHaveClass("custom-header");
    });
  });

  describe("CardTitle", () => {
    it("renders title text", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>My Card Title</CardTitle>
          </CardHeader>
        </Card>
      );

      expect(screen.getByText("My Card Title")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle data-testid="title">Title</CardTitle>
          </CardHeader>
        </Card>
      );

      const title = screen.getByTestId("title");
      expect(title).toHaveAttribute("data-slot", "card-title");
    });

    it("has font-semibold class", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle data-testid="title">Title</CardTitle>
          </CardHeader>
        </Card>
      );

      const title = screen.getByTestId("title");
      expect(title).toHaveClass("font-semibold");
    });

    it("applies custom className to title", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle className="text-xl" data-testid="title">
              Title
            </CardTitle>
          </CardHeader>
        </Card>
      );

      const title = screen.getByTestId("title");
      expect(title).toHaveClass("text-xl");
    });
  });

  describe("CardDescription", () => {
    it("renders description text", () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>This is a description</CardDescription>
          </CardHeader>
        </Card>
      );

      expect(screen.getByText("This is a description")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription data-testid="desc">Description</CardDescription>
          </CardHeader>
        </Card>
      );

      const desc = screen.getByTestId("desc");
      expect(desc).toHaveAttribute("data-slot", "card-description");
    });

    it("has muted text styling", () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription data-testid="desc">Description</CardDescription>
          </CardHeader>
        </Card>
      );

      const desc = screen.getByTestId("desc");
      expect(desc).toHaveClass("text-muted-foreground");
      expect(desc).toHaveClass("text-sm");
    });

    it("applies custom className to description", () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription className="text-xs" data-testid="desc">
              Description
            </CardDescription>
          </CardHeader>
        </Card>
      );

      const desc = screen.getByTestId("desc");
      expect(desc).toHaveClass("text-xs");
    });
  });

  describe("CardContent", () => {
    it("renders content correctly", () => {
      render(
        <Card>
          <CardContent>Main Content Here</CardContent>
        </Card>
      );

      expect(screen.getByText("Main Content Here")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Card>
          <CardContent data-testid="content">Content</CardContent>
        </Card>
      );

      const content = screen.getByTestId("content");
      expect(content).toHaveAttribute("data-slot", "card-content");
    });

    it("has horizontal padding", () => {
      render(
        <Card>
          <CardContent data-testid="content">Content</CardContent>
        </Card>
      );

      const content = screen.getByTestId("content");
      expect(content).toHaveClass("px-6");
    });

    it("applies custom className to content", () => {
      render(
        <Card>
          <CardContent className="py-8" data-testid="content">
            Content
          </CardContent>
        </Card>
      );

      const content = screen.getByTestId("content");
      expect(content).toHaveClass("py-8");
    });

    it("renders complex content", () => {
      render(
        <Card>
          <CardContent>
            <p>Paragraph 1</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </CardContent>
        </Card>
      );

      expect(screen.getByText("Paragraph 1")).toBeInTheDocument();
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });
  });

  describe("CardFooter", () => {
    it("renders footer content", () => {
      render(
        <Card>
          <CardFooter>Footer Content</CardFooter>
        </Card>
      );

      expect(screen.getByText("Footer Content")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Card>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      );

      const footer = screen.getByTestId("footer");
      expect(footer).toHaveAttribute("data-slot", "card-footer");
    });

    it("has flex layout", () => {
      render(
        <Card>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      );

      const footer = screen.getByTestId("footer");
      expect(footer).toHaveClass("flex");
      expect(footer).toHaveClass("items-center");
    });

    it("has horizontal padding", () => {
      render(
        <Card>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      );

      const footer = screen.getByTestId("footer");
      expect(footer).toHaveClass("px-6");
    });

    it("applies custom className to footer", () => {
      render(
        <Card>
          <CardFooter className="justify-between" data-testid="footer">
            Footer
          </CardFooter>
        </Card>
      );

      const footer = screen.getByTestId("footer");
      expect(footer).toHaveClass("justify-between");
    });
  });

  describe("CardAction", () => {
    it("renders action content", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardAction>Action</CardAction>
          </CardHeader>
        </Card>
      );

      expect(screen.getByText("Action")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Card>
          <CardHeader>
            <CardAction data-testid="action">Action</CardAction>
          </CardHeader>
        </Card>
      );

      const action = screen.getByTestId("action");
      expect(action).toHaveAttribute("data-slot", "card-action");
    });

    it("is positioned for grid layout", () => {
      render(
        <Card>
          <CardHeader>
            <CardAction data-testid="action">Action</CardAction>
          </CardHeader>
        </Card>
      );

      const action = screen.getByTestId("action");
      expect(action).toHaveClass("col-start-2");
      expect(action).toHaveClass("row-span-2");
    });

    it("applies custom className to action", () => {
      render(
        <Card>
          <CardHeader>
            <CardAction className="gap-2" data-testid="action">
              Action
            </CardAction>
          </CardHeader>
        </Card>
      );

      const action = screen.getByTestId("action");
      expect(action).toHaveClass("gap-2");
    });
  });

  describe("Complete Card Composition", () => {
    it("renders complete card with header and footer", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Complete Card</CardTitle>
            <CardDescription>A complete card example</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the main content area.</p>
          </CardContent>
          <CardFooter>
            <button>Cancel</button>
            <button>Submit</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText("Complete Card")).toBeInTheDocument();
      expect(screen.getByText("A complete card example")).toBeInTheDocument();
      expect(
        screen.getByText("This is the main content area.")
      ).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Submit")).toBeInTheDocument();
    });

    it("renders card with header action", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card with Action</CardTitle>
            <CardDescription>Has an action button</CardDescription>
            <CardAction>
              <button>Settings</button>
            </CardAction>
          </CardHeader>
          <CardContent>Content here</CardContent>
        </Card>
      );

      expect(screen.getByText("Card with Action")).toBeInTheDocument();
      expect(screen.getByText("Has an action button")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText("Content here")).toBeInTheDocument();
    });

    it("renders card with only content", () => {
      render(
        <Card>
          <CardContent>Simple card with only content</CardContent>
        </Card>
      );

      expect(
        screen.getByText("Simple card with only content")
      ).toBeInTheDocument();
    });

    it("renders nested cards", () => {
      render(
        <Card data-testid="outer-card">
          <CardContent>
            <Card data-testid="inner-card">
              <CardContent>Nested card content</CardContent>
            </Card>
          </CardContent>
        </Card>
      );

      const outerCard = screen.getByTestId("outer-card");
      const innerCard = screen.getByTestId("inner-card");

      expect(outerCard).toContainElement(innerCard);
      expect(screen.getByText("Nested card content")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("supports role attribute", () => {
      render(
        <Card role="region" aria-label="Statistics" data-testid="card">
          <CardContent>Stats content</CardContent>
        </Card>
      );

      const card = screen.getByRole("region", { name: "Statistics" });
      expect(card).toBeInTheDocument();
    });

    it("supports aria-labelledby for title", () => {
      render(
        <Card aria-labelledby="card-title" data-testid="card">
          <CardHeader>
            <CardTitle id="card-title">Accessible Card</CardTitle>
          </CardHeader>
        </Card>
      );

      const card = screen.getByTestId("card");
      expect(card).toHaveAttribute("aria-labelledby", "card-title");
    });

    it("supports aria-describedby for description", () => {
      render(
        <Card aria-describedby="card-desc" data-testid="card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription id="card-desc">
              This card has accessibility attributes
            </CardDescription>
          </CardHeader>
        </Card>
      );

      const card = screen.getByTestId("card");
      expect(card).toHaveAttribute("aria-describedby", "card-desc");
    });
  });
});
