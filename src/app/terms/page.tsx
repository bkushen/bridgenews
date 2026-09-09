import { CmsPage, cmsMetadata } from "@/components/cms-page";
export async function generateMetadata(){return cmsMetadata("terms");}
export default function TermsPage(){return <CmsPage slug="terms"/>;}
