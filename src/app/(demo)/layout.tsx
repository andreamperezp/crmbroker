import { AppShell } from "@/components/app-shell";

/** Los 4 perfiles comparten la barra superior, el menú y los avisos de la demo. */
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
