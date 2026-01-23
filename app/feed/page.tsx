import type { Metadata } from "next";
import FeedClient from "./FeedClient";

export const metadata: Metadata = {
  title: "Feed | Geev",
  description: "Browse giveaways and help requests",
};

export default function FeedPage() {
  return <FeedClient />;
}
