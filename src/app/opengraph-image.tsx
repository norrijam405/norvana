import { ImageResponse } from "next/og";

export const alt = "Acre Era — Fresh food, everyday goods, premium finds, and changing Eras";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "70px 78px",
          background: "#2F3026",
          color: "#F6F1E7",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: "68%" }}>
          <div style={{ fontSize: 28, letterSpacing: 6, color: "#E8C68A", fontWeight: 700 }}>
            ACRE ERA
          </div>
          <div style={{ marginTop: 28, fontSize: 72, lineHeight: 0.98, fontWeight: 800 }}>
            From open roads to open markets.
          </div>
          <div style={{ marginTop: 28, fontSize: 28, lineHeight: 1.35, color: "#DAD7CE" }}>
            Fresh food, everyday goods, premium finds, and changing Eras in one connected shopping world.
          </div>
        </div>
        <div
          style={{
            width: 250,
            height: 250,
            borderRadius: 54,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F6F1E7",
            position: "relative",
          }}
        >
          <div style={{ fontSize: 96, fontWeight: 900, color: "#2F3026", letterSpacing: -10 }}>AE</div>
          <div
            style={{
              position: "absolute",
              bottom: 56,
              left: 43,
              width: 158,
              height: 18,
              borderRadius: 20,
              background: "#E8C68A",
              transform: "rotate(-8deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 78,
              left: 92,
              width: 82,
              height: 30,
              borderRadius: "100% 0 100% 0",
              background: "#526642",
              transform: "rotate(-20deg)",
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
