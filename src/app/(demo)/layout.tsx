import { DemoBar } from "@/components/demo-bar";

/** Los 4 perfiles comparten la barra de la demo. */
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
    </>
  );
}
