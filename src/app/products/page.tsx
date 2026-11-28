import UnderConstruction from "../../components/UnderConstruction";
import PageHeader from "../../components/page/PageHeader";

export default function ProductsPage() {
  return (
    <main className="flex flex-col flex-1">
      <PageHeader eyebrow="/ products" title="Under construction" accent="construction" />
      <UnderConstruction />
    </main>
  );
}
