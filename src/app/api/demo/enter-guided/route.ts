import { handleEnterGuidedDemoRequest } from "@/server/demo/enter-guided-demo";

export async function GET(request: Request) {
  return handleEnterGuidedDemoRequest(request);
}
