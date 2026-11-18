import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

// Header y footer viven en el layout para que `loading.tsx` (que solo
// reemplaza a la page) los mantenga visibles mientras llega el contenido.
export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
