import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { stripe } from "../../services/stripe";

import Home, { getStaticProps } from "../../pages";

jest.mock("next-auth/react");

jest.mock("next/router", () => ({
  useRouter: jest.fn()
}));

jest.mock("../../services/stripe");

const useSessionMocked = jest.mocked(useSession);
const useRouterMocked = jest.mocked(useRouter);

describe("Home page", () => {
  it("renders correctly", () => {
    useSessionMocked.mockReturnValueOnce({
      data: null,
      status: "unauthenticated"
    });

    render(<Home product={{ priceId: "1", amount: "R$10,00" }} />);

    expect(screen.getByText("for R$10,00 month")).toBeInTheDocument();
  });

  it("loads inital data", async () => {
    const retrieveStripePricesMocked = jest.mocked(stripe.prices.retrieve);

    retrieveStripePricesMocked.mockResolvedValueOnce({
      id: "fake-id",
      unit_amount: 1000
    } as any);

    const response = await getStaticProps({});

    expect(response).toEqual(
      expect.objectContaining({
        props: {
          product: {
            priceId: "fake-id",
            amount: "$10.00"
          }
        }
      })
    );
  });
});
