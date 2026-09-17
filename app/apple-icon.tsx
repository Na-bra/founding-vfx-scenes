import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ff3d2e 0%, #ff6a3d 55%, #ffb547 100%)",
          color: "#160905",
          fontSize: 120,
          fontWeight: 800,
          letterSpacing: -6,
        }}
      >
        F.
      </div>
    ),
    size,
  );
}
