import { CmsPage, cmsMetadata } from "@/components/cms-page";
export async function generateMetadata(){return cmsMetadata("contact");}
export default function ContactPage(){return <CmsPage slug="contact"/>;}
