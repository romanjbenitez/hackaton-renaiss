import Link from "next/link";
import { notFound } from "next/navigation";

import { updatePropertyAction } from "./actions";

import { PhotoUploader } from "@/components/agency/photo-uploader";
import { getAgencyPropertyById } from "@/lib/agency/properties";
import { getAgencyUserByEmail } from "@/lib/agency/transactions";
import { requireUserRole } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EditPropertyPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EditPropertyPage({ params, searchParams }: EditPropertyPageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const session = await requireUserRole("agency");
  const email = session.user?.email;

  if (!email) notFound();

  const agency = await getAgencyUserByEmail(email);
  if (!agency) notFound();

  const property = await getAgencyPropertyById(id, agency.id);
  if (!property) notFound();

  const error = getSearchValue(resolvedSearchParams.error);

  return (
    <main className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
            {error}
          </div>
        ) : null}

        <div>
          <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Editar propiedad</p>
          <h1 className="mt-3 text-4xl font-semibold text-balance">{property.title}</h1>
          <p className="text-muted-foreground mt-3 leading-8">
            Los campos marcados con <span className="text-rose-500">*</span> son obligatorios.
          </p>
        </div>

        <form action={updatePropertyAction} className="mt-8 space-y-8">
          <input type="hidden" name="id" value={property.id} />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">
                Título comercial <span className="text-rose-500">*</span>
              </span>
              <input
                name="title"
                required
                minLength={5}
                defaultValue={property.title}
                className="h-12 w-full rounded-2xl border px-4"
                placeholder="Ej: 3 ambientes con balcón y amenities"
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Descripción breve</span>
              <textarea
                name="description"
                defaultValue={property.description ?? ""}
                className="min-h-28 w-full rounded-2xl border px-4 py-3"
                placeholder="Resumen operativo del inmueble"
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">
                Dirección <span className="text-rose-500">*</span>
              </span>
              <input
                name="addressLine"
                required
                defaultValue={property.addressLine}
                className="h-12 w-full rounded-2xl border px-4"
                placeholder="Calle y altura"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">
                Ciudad / Barrio <span className="text-rose-500">*</span>
              </span>
              <input
                name="city"
                required
                defaultValue={property.city}
                className="h-12 w-full rounded-2xl border px-4"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">
                Provincia <span className="text-rose-500">*</span>
              </span>
              <input
                name="province"
                required
                defaultValue={property.province}
                className="h-12 w-full rounded-2xl border px-4"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Tipo</span>
              <select
                name="propertyType"
                defaultValue={property.propertyType}
                className="h-12 w-full rounded-2xl border px-4"
              >
                <option value="APARTMENT">Departamento</option>
                <option value="HOUSE">Casa</option>
                <option value="PH">PH</option>
                <option value="STUDIO">Monoambiente</option>
                <option value="OFFICE">Oficina</option>
                <option value="COMMERCIAL">Local</option>
                <option value="LAND">Lote</option>
                <option value="OTHER">Otro</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Estado</span>
              <select
                name="status"
                defaultValue={property.status}
                className="h-12 w-full rounded-2xl border px-4"
              >
                <option value="DRAFT">Borrador</option>
                <option value="PUBLISHED">Publicada</option>
                <option value="PAUSED">Pausada</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">
                m² <span className="text-rose-500">*</span>
              </span>
              <input
                name="squareMeters"
                type="number"
                min="1"
                required
                defaultValue={property.squareMeters ?? ""}
                className="h-12 w-full rounded-2xl border px-4"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">
                Ambientes <span className="text-rose-500">*</span>
              </span>
              <input
                name="bedrooms"
                type="number"
                min="0"
                required
                defaultValue={property.bedrooms ?? ""}
                className="h-12 w-full rounded-2xl border px-4"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">
                Baños <span className="text-rose-500">*</span>
              </span>
              <input
                name="bathrooms"
                type="number"
                min="1"
                required
                defaultValue={property.bathrooms ?? ""}
                className="h-12 w-full rounded-2xl border px-4"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">
                Alquiler mensual <span className="text-rose-500">*</span>
              </span>
              <input
                name="price"
                required
                defaultValue={property.price}
                className="h-12 w-full rounded-2xl border px-4"
                placeholder="950000"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Expensas</span>
              <input
                name="expenses"
                defaultValue={property.expenses || ""}
                className="h-12 w-full rounded-2xl border px-4"
                placeholder="120000"
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Link externo</span>
              <input
                name="externalUrl"
                defaultValue={property.externalUrl ?? ""}
                className="h-12 w-full rounded-2xl border px-4"
                placeholder="https://zonaprop.com/..."
              />
            </label>
            <div className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Fotos</span>
              <PhotoUploader defaultUrls={property.photos} />
            </div>
          </div>

          <div className="rounded-3xl border p-6">
            <p className="text-lg font-semibold">Ficha de compatibilidad</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium">Score aspiracional</span>
                <input
                  name="targetTrustScore"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={property.targetTrustScore ?? 75}
                  className="h-12 w-full rounded-2xl border px-4"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Perfil preferido</span>
                <select
                  name="preferredProfile"
                  defaultValue={property.preferredProfile ?? "EMPLOYED"}
                  className="h-12 w-full rounded-2xl border px-4"
                >
                  <option value="EMPLOYED">Relación de dependencia</option>
                  <option value="MONOTRIBUTISTA">Monotributista</option>
                  <option value="SELF_EMPLOYED">Autónomo</option>
                  <option value="RETIRED">Jubilado</option>
                </select>
              </label>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium">Garantías aceptadas</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                {(["MORTGAGE", "CAUTION_INSURANCE", "NONE"] as const).map((g) => (
                  <label key={g} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="acceptedGuarantees"
                      value={g}
                      defaultChecked={property.acceptedGuarantees.includes(g)}
                    />
                    {g === "MORTGAGE"
                      ? "Garantía hipotecaria"
                      : g === "CAUTION_INSURANCE"
                        ? "Seguro de caución"
                        : "Sin garantía"}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm">
                <input type="checkbox" name="acceptsPets" defaultChecked={property.acceptsPets} />
                Acepta mascotas
              </label>
              <label className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  name="acceptsChildren"
                  defaultChecked={property.acceptsChildren}
                />
                Acepta niños
              </label>
              <label className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  name="acceptsSmokers"
                  defaultChecked={property.acceptsSmokers}
                />
                Acepta fumadores
              </label>
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-medium">Notas de compatibilidad</span>
              <textarea
                name="compatibilityNotes"
                defaultValue={property.compatibilityNotes ?? ""}
                className="min-h-28 w-full rounded-2xl border px-4 py-3"
                placeholder="Ej: se prioriza estabilidad laboral y bajo ratio ingreso/alquiler"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className={cn(buttonVariants(), "rounded-2xl")}>Guardar cambios</button>
            <Link
              href={`/agency/properties/${property.id}`}
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Cancelar
            </Link>
          </div>
        </form>
      </section>

      <aside className="space-y-6">
        <div className="bg-background rounded-4xl border p-8 shadow-sm">
          <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Datos actuales</p>
          <dl className="mt-4 space-y-2 text-sm leading-7">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Estado</dt>
              <dd className="font-medium">{property.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Candidaturas</dt>
              <dd className="font-medium">{property._count.candidacies}</dd>
            </div>
          </dl>
        </div>
      </aside>
    </main>
  );
}
