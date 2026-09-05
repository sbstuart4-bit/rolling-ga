import { redirect } from "next/navigation";

/** Legacy route — Live Command Center now lives at `/studio`. */
export default function StudioLiveRedirectPage() {
  redirect("/studio");
}
