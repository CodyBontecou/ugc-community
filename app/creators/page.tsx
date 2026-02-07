import { getCreatorsForTable } from "@/lib/directory/table-queries";
import { CreatorsDataTable } from "@/components/directory/creators-data-table";

export const dynamic = "force-dynamic";

export default async function CreatorsPage() {
  const creators = await getCreatorsForTable();

  return <CreatorsDataTable creators={creators} />;
}
