import { render, screen } from "@testing-library/react";

import { getPrismicClient } from "../../services/prismic";
import Post, { getServerSideProps } from "../../pages/posts/[slug]";
import { getSession } from "next-auth/react";

jest.mock("next-auth/react");
jest.mock("../../services/prismic");

const useSessionMocked = jest.mocked(getSession);

const post = {
  slug: "my-new-post",
  title: "My New Post",
  content: "<p>Post exceerpt</p>",
  updatedAt: "March, 10"
};

describe("Post page", () => {
  it("renders correctly", () => {
    render(<Post post={post} />);

    expect(screen.getByText("My New Post")).toBeInTheDocument();
  });

  it("redirects user if no subscription is found", async () => {
    useSessionMocked.mockResolvedValueOnce({
      activeSubscription: null
    } as any);

    const response = await getServerSideProps({
      params: { slug: "my-new-post" }
    } as any);

    expect(response).toEqual(
      expect.objectContaining({
        redirect: expect.objectContaining({
          destination: "/"
        })
      })
    );
  });

  it("loads initial data", async () => {
    useSessionMocked.mockResolvedValueOnce({
      activeSubscription: "fake-active-subscription"
    } as any);

    const getPrismicClientMocked = jest.mocked(getPrismicClient);

    getPrismicClientMocked.mockReturnValueOnce({
      getByUID: jest.fn().mockResolvedValue({
        data: {
          title: "My New Post",
          content: [{ type: "paragraph", text: "Post excerpt" }]
        },
        last_publication_date: "04-01-2021"
      })
    } as any);

    const response = await getServerSideProps({
      params: { slug: "my-new-post" }
    } as any);

    expect(response).toEqual(
      expect.objectContaining({
        props: {
          post: {
            slug: "my-new-post",
            title: "My New Post",
            content: "<p>Post excerpt</p>",
            updatedAt: "01 de abril de 2021"
          }
        }
      })
    );
  });
});
