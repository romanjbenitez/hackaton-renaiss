import Link from "next/link";

import { createPropertyAction } from "./actions";

import { PhotoUploader } from "@/components/agency/photo-uploader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NewAgencyPropertyPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewAgencyPropertyPage({ searchParams }: NewAgencyPropertyPageProps) {
  const params = await searchParams;
  const error = getSearchValue(params.error);

  return (
    <main className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="bg-background rounded-4xl border p-8 shadow-sm">
        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
            {error}
          </div>
        ) : null}

        <div>
          <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Nueva propiedad</p>
          <h1 className="mt-3 text-4xl font-semibold text-balance">
            Cargá la ficha base del inmueble
          </h1>
          <p className="text-muted-foreground mt-3 max-w-3xl leading-8">
            Los campos marcados con <span className="text-rose-500">*</span> son obligatorios.
          </p>
        </div>

        <form action={createPropertyAction} className="mt-8 space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">
                Título comercial <span className="text-rose-500">*</span>
              </span>
              <input
                name="title"
                required
                minLength={5}
                className="h-12 w-full rounded-2xl border px-4"
                placeholder="Ej: 3 ambientes con balcón y amenities"
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Descripción breve</span>
              <textarea
                name="description"
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
                className="h-12 w-full rounded-2xl border px-4"
                placeholder="Calle y altura"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">
                Ciudad / Barrio <span className="text-rose-500">*</span>
              </span>
              <input name="city" required className="h-12 w-full rounded-2xl border px-4" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">
                Provincia <span className="text-rose-500">*</span>
              </span>
              <input name="province" required className="h-12 w-full rounded-2xl border px-4" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Tipo</span>
              <select
                name="propertyType"
                className="h-12 w-full rounded-2xl border px-4"
                defaultValue="APARTMENT"
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
                className="h-12 w-full rounded-2xl border px-4"
                defaultValue="DRAFT"
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
                className="h-12 w-full rounded-2xl border px-4"
                placeholder="950000"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Expensas</span>
              <input
                name="expenses"
                className="h-12 w-full rounded-2xl border px-4"
                placeholder="120000"
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Link externo</span>
              <input
                name="externalUrl"
                className="h-12 w-full rounded-2xl border px-4"
                placeholder="https://zonaprop.com/..."
              />
            </label>
            <div className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Fotos</span>
              <PhotoUploader />
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
                  defaultValue="75"
                  className="h-12 w-full rounded-2xl border px-4"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Perfil preferido</span>
                <select
                  name="preferredProfile"
                  className="h-12 w-full rounded-2xl border px-4"
                  defaultValue="EMPLOYED"
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
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="acceptedGuarantees"
                    value="MORTGAGE"
                    defaultChecked
                  />
                  Garantía hipotecaria
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="acceptedGuarantees"
                    value="CAUTION_INSURANCE"
                    defaultChecked
                  />
                  Seguro de caución
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="acceptedGuarantees" value="NONE" />
                  Sin garantía
                </label>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm">
                <input type="checkbox" name="acceptsPets" defaultChecked />
                Acepta mascotas
              </label>
              <label className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm">
                <input type="checkbox" name="acceptsChildren" defaultChecked />
                Acepta niños
              </label>
              <label className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm">
                <input type="checkbox" name="acceptsSmokers" />
                Acepta fumadores
              </label>
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-medium">Notas de compatibilidad</span>
              <textarea
                name="compatibilityNotes"
                className="min-h-28 w-full rounded-2xl border px-4 py-3"
                placeholder="Ej: se prioriza estabilidad laboral y bajo ratio ingreso/alquiler"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className={cn(buttonVariants(), "rounded-2xl")}>Guardar propiedad</button>
            <Link
              href="/agency/properties"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Cancelar
            </Link>
          </div>
        </form>
      </section>

      <aside className="space-y-6">
        <div className="bg-background rounded-4xl border p-8 shadow-sm">
          <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Checklist</p>
          <ul className="mt-4 space-y-3 text-sm leading-7">
            <li>Definí un título corto y una dirección precisa.</li>
            <li>Subí al menos una foto para renderizar la tarjeta y la portada.</li>
            <li>Marcá reglas de compatibilidad para usar luego en ranking.</li>
          </ul>
        </div>

        <div className="bg-background rounded-4xl border p-8 shadow-sm">
          <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Siguiente iteración</p>
          <p className="text-muted-foreground mt-4 text-sm leading-7">
            Con esta ficha ya queda preparado el terreno para sumar postulaciones, ranking por score
            y compatibilidad IA sin rediseñar el flujo de backoffice.
          </p>
        </div>
      </aside>
    </main>
  );
}
