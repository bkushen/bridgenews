import type { Metadata } from "next";
import { RegionalHomepageV2 } from "@/components/regional-homepage-v2";

export const metadata: Metadata = {
  title: "Sri Lanka News | BridgeNews",
  description: "Live Sri Lanka news in English, Sinhala and Tamil, with Colombo weather, trending coverage and regional updates.",
  alternates: { canonical: "/sri-lanka" },
};

export default async function SriLankaPage({ searchParams }: { searchParams: Promise<{ language?: string }> }) {
  const params = await searchParams;
  const language = params.language === "si" || params.language === "ta" ? params.language : "en";

  return (
    <div className="sri-lanka-edition-page">
      <style>{`
        .sri-lanka-edition-page > main > section:first-of-type {
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #ffffff;
          padding: 9px 10px 9px 14px;
        }

        .sri-lanka-edition-page > main > section:first-of-type::before {
          content: "Sri Lanka News  ·  Choose edition";
          display: block;
          flex: 1 1 auto;
          min-width: 0;
          color: #475467;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }

        .sri-lanka-edition-page > main > section:first-of-type > div {
          display: grid;
          flex: 0 0 auto;
          grid-template-columns: repeat(3, minmax(84px, 1fr));
          gap: 4px;
          overflow: visible;
        }

        .sri-lanka-edition-page > main > section:first-of-type a {
          min-width: 0 !important;
          border: 1px solid #d0d5dd;
          border-radius: 8px;
          background: #ffffff !important;
          color: #101828 !important;
          padding: 8px 12px !important;
          box-shadow: none !important;
          white-space: nowrap;
        }

        .sri-lanka-edition-page > main > section:first-of-type a[class*="bg-[#3157d5]"] {
          border-color: #101010 !important;
          background: #101010 !important;
          color: #ffffff !important;
        }

        .sri-lanka-edition-page > main > section:first-of-type a:hover {
          border-color: #101010;
          background: #f5f5f5 !important;
          color: #101010 !important;
        }

        .sri-lanka-edition-page > main > section:first-of-type a[class*="bg-[#3157d5]"]:hover {
          background: #101010 !important;
          color: #ffffff !important;
        }

        .sri-lanka-edition-page > main > section:first-of-type a span:first-child {
          font-size: 12px !important;
          font-weight: 800 !important;
          line-height: 1.2;
        }

        .sri-lanka-edition-page > main > section:first-of-type a span:nth-child(2) {
          display: none;
        }

        @media (max-width: 640px) {
          .sri-lanka-edition-page > main > section:first-of-type {
            display: block;
            padding: 10px;
          }

          .sri-lanka-edition-page > main > section:first-of-type::before {
            content: "Choose Sri Lanka edition";
            margin: 0 0 8px 2px;
            font-size: 9px;
          }

          .sri-lanka-edition-page > main > section:first-of-type > div {
            width: 100%;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .sri-lanka-edition-page > main > section:first-of-type a {
            padding: 9px 6px !important;
          }

          .sri-lanka-edition-page > main > section:first-of-type a span:first-child {
            font-size: 12px !important;
          }
        }
      `}</style>
      <RegionalHomepageV2 region="sri-lanka" language={language} />
    </div>
  );
}
