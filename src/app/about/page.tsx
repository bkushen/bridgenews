import { CmsPage, cmsMetadata } from "@/components/cms-page";
export async function generateMetadata(){return cmsMetadata("about");}
export default function AboutPage(){return <CmsPage slug="about"/>;}
