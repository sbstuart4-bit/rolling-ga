import { redirect } from "next/navigation";

/** Legacy dev route — Asset QA lives under Rolling GA Ops. */
export default function DemoAssetsRedirect() {
  redirect("/ops/assets");
}
