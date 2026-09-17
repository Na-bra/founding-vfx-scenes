import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = "FoundingVFX — ScenePacks for your next edit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "radial-gradient(circle at 20% 30%, #5a1a0c 0%, #07070a 55%)",
          color: "#f5f4f2",
        }}
      >
        <div style={{ display: "flex", fontSize: 128, fontWeight: 800, letterSpacing: -8 }}>
          FOUNDING<span style={{ color: "#ff6a3d" }}>VFX</span>
        </div>
        <div style={{ fontSize: 40, color: "#a9a6b1", marginTop: 24, maxWidth: 900 }}>{siteConfig.tagline}</div>
      </div>
    ),
    size,
  );
}
