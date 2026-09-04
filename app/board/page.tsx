import type { Metadata } from "next";
import Link from "next/link";
import ChessBoardScene from "./ChessBoardScene";

export const metadata: Metadata = {
  title: "3D Chess Board — Verci Chess",
  description: "Explore the Verci folding wooden chess board in three dimensions.",
};

export default function BoardPage() {
  return (
    <main className="model-page">
      <header className="model-header">
        <Link className="model-back" href="/">← Leaderboard</Link>
        <div>
          <p>FROM THE VERCI BOARD</p>
          <h1>Folding chess set</h1>
        </div>
        <span className="model-badge">3D model</span>
      </header>
      <ChessBoardScene />
    </main>
  );
}
