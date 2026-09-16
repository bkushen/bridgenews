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
          margin-bottom: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #ffffff;
          padding: 12px;
        }

        .sri-lanka-edition-page > main > section:first-of-type::before {
          content: "Choose your edition";
          display: block;
          margin: 0 0 9px 2px;
          color: #667085;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .sri-lanka-edition-page > main > section:first-of-type > div {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
          overflow: visible;
        }

        .sri-lanka-edition-page > main > section:first-of-type a {
          min-width: 0 !important;
          border: 1px solid #d0d5dd;
          border-radius: 9px;
          background: #ffffff !important;
          color: #101828 !important;
          padding: 10px 12px !important;
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
          font-size: 13px !important;
          font-weight: 800 !important;
          line-height: 1.2;
        }

        .sri-lanka-edition-page > main > section:first-of-type a span:nth-child(2) {
          display: none;
        }

        @media (max-width: 420px) {
          .sri-lanka-edition-page > main > section:first-of-type {
            padding: 10px;
          }

          .sri-lanka-edition-page > main > section:first-of-type a {
            padding: 10px 7px !important;
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
