import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import { SubscribeButton } from ".";

jest.mock("next-auth/react");
//jest.mock("next/router");

jest.mock("next/router", () => ({
  useRouter: jest.fn()
}));

const useSessionMocked = jest.mocked(useSession);
const useRouterMocked = jest.mocked(useRouter);

describe("SubscribeButton Component", () => {
  it("renders correctly", () => {
    useSessionMocked.mockReturnValueOnce({
      data: null,
      status: "unauthenticated"
    });

    render(<SubscribeButton />);

    expect(screen.getByText("Subscribe now")).toBeInTheDocument();
  });

  it("redirects user to sign in when not authenticated", () => {
    const signInMocked = jest.mocked(signIn);

    useSessionMocked.mockReturnValueOnce({
      data: null,
      status: "unauthenticated"
    });

    render(<SubscribeButton />);

    const subscribeButton = screen.getByText("Subscribe now");

    fireEvent.click(subscribeButton);

    expect(signInMocked).toHaveBeenCalled();
  });

  it("redirects to posts when user already has a subscription", () => {
    const pushMocked = jest.fn();

    useSessionMocked.mockReturnValue({
      data: {
        user: {
          name: "John Doe",
          email: "john.doe@example.com"
        },
        activeSubscription: "fake-active-subscription",
        expires: "fake-expires"
      },
      status: "authenticated"
    } as any);

    useRouterMocked.mockReturnValueOnce({
      push: pushMocked
    } as any);

    render(<SubscribeButton />);

    const subscribeButton = screen.getByText("Subscribe now");

    fireEvent.click(subscribeButton);

    expect(pushMocked).toHaveBeenCalledWith("/posts");
  });
});
