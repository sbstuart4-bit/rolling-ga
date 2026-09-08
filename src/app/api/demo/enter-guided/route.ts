import { handleEnterGuidedDemoRequest } from "@/server/demo/enter-guided-demo";

export const maxDuration = 300;

export async function GET(request: Request) {
  return handleEnterGuidedDemoRequest(request);
}
