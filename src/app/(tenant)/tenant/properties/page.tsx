import { PropertiesCatalog } from "@/components/tenant/properties-catalog";
import { applyToPropertyAction } from "@/app/(tenant)/tenant/properties/actions";
import { getTenantPublishedProperties } from "@/lib/tenant/properties";

type TenantPropertiesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TenantPropertiesPage({ searchParams }: TenantPropertiesPageProps) {
  const resolvedSearchParams = await searchParams;
  const catalog = await getTenantPublishedProperties();

  if (!catalog) {
    return null;
  }

  return (
    <PropertiesCatalog
      properties={catalog.properties}
      applyAction={applyToPropertyAction}
      message={getSearchValue(resolvedSearchParams.message)}
      error={getSearchValue(resolvedSearchParams.error)}
      hasCompleteProfile={catalog.hasCompleteProfile}
    />
  );
}
