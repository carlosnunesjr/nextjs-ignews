import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { AppProps } from "next/app";

import { Header } from "../components/Header";

import "../styles/global.scss";

function MyApp({
  Component,
  pageProps,
  session
}: AppProps & { session: Session }) {
  return (
    <SessionProvider session={session}>
      <Header />
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
