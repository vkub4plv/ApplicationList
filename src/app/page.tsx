import { getLinks, SortMethod } from "@/lib/links";
import ClientHome from "@/components/ClientHome";

export default async function HomeServerPage(props: { searchParams?: Promise<{ sort?: SortMethod }> }) {
  const searchParams = await props.searchParams;
  const sort = searchParams?.sort ?? "default";
  const links = await getLinks(sort);

  return <ClientHome links={links} sort={sort} />;
}