import { CmsPage, cmsMetadata } from "@/components/cms-page";
export async function generateMetadata(){return cmsMetadata("privacy");}
export default function PrivacyPage(){return <CmsPage slug="privacy"/>;}
