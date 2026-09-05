import {
  marketingOpenGraphImage,
  OG_ALT,
  OG_CONTENT_TYPE,
  OG_SIZE,
} from "@/components/marketing/og-image";

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return marketingOpenGraphImage();
}
