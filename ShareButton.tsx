"use client";

import { sdk } from "@farcaster/miniapp-sdk";

export default function ShareButton() {
  const handleShare = async () => {
    try {
      await sdk.actions.composeCast({
        text: "🚀 Just tried this Mini App built with OnchainKit!",
        embeds: ["https://yourapp.vercel.app"], // ersetze durch deine Live-URL
      });
    } catch (err) {
      console.error("Share failed:", err);
      alert("Couldn't share on Farcaster. Are you in Warpcast?");
    }
  };

  return (
    <button
      onClick={handleShare}
      className="mt-8 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
    >
      Share on Farcaster
    </button>
  );
}
