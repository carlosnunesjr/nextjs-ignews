import { render, screen } from "@testing-library/react";

import { getPrismicClient } from "../../services/prismic";
import PostPreview, { getStaticProps } from "../../pages/posts/preview/[slug]";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

jest.mock("next-auth/react");
jest.mock("../../services/prismic");

jest.mock("next/router", () => ({
  useRouter: jest.fn()
}));

const useSessionMocked = jest.mocked(useSession);
const useRouterMocked = jest.mocked(useRouter);

const post = {
  slug: "my-new-post",
  title: "My New Post",
  content: "<p>Post exceerpt</p>",
  updatedAt: "March, 10"
};

describe("PostPreview page", () => {
  it("renders correctly", () => {
    useSessionMocked.mockReturnValueOnce({
      data: null,
      status: "unauthenticated"
    });

    render(<PostPreview post={post} />);

    expect(screen.getByText("My New Post")).toBeInTheDocument();
    expect(screen.getByText("Wanna continue reading?")).toBeInTheDocument();
  });

  it("redirects user to full post when user is subscribed", async () => {
    useSessionMocked.mockReturnValue({
      data: {
        activeSubscription: "fake-active-subscription"
      },
      status: "authenticated"
    } as any);

    const pushMocked = jest.fn();
    useRouterMocked.mockReturnValueOnce({
      push: pushMocked
    } as any);

    render(<PostPreview post={post} />);

    expect(pushMocked).toHaveBeenCalledWith("/posts/my-new-post");
  });

  it("loads initial data", async () => {
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

    const response = await getStaticProps({
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
