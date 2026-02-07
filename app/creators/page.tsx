import { getDirectoryCreators } from "@/lib/directory/queries";
import { CreatorDirectory } from "@/components/directory/creator-directory";

export const dynamic = "force-dynamic";

export default async function CreatorsPage() {
  // Initial server-side fetch — only creators with live portfolios (siteEnabled)
  const { creators, total } = await getDirectoryCreators({}, { sort: "popular" }, { pageSize: 24 });

  return (
    <CreatorDirectory
      initialCreators={creators}
      initialTotal={total}
    />
  );
}
