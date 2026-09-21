"use client";

import { usePathname } from "next/navigation";

import { areaFor } from "@/app/admin/nav";

/**
 * Which part of the console you are looking at.
 *
 * A client component for one reason: the bar it sits in is rendered by the
 * layout and a layout does not re-render on navigation, so a label worked out
 * on the server would be whichever page happened to be loaded first and would
 * then be wrong for the rest of the session. usePathname re-renders.
 *
 * That is the whole point of moving the bar into the layout. The bar used to
 * be rendered by each page, which meant every click tore down the chrome and
 * rebuilt it after the server had finished, and the console looked frozen for
 * as long as the queries took.
 */
export function AdminArea() {
  return <>{areaFor(usePathname())}</>;
}
