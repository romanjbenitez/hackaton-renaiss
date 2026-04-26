"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DashboardChartsProps = {
  propertyStatusData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  transactionStageData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
};

function formatTooltipValue(value: number | string | undefined, label: string) {
  return [typeof value === "number" ? value : Number(value ?? 0), label] as const;
}

export function DashboardCharts({
  propertyStatusData,
  transactionStageData,
}: DashboardChartsProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <article className="bg-background rounded-4xl border p-8 shadow-sm">
        <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Distribución</p>
        <h3 className="mt-3 text-2xl font-semibold">Estado del inventario</h3>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={propertyStatusData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={96}
                paddingAngle={4}
              >
                {propertyStatusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatTooltipValue(value as number | string | undefined, "Propiedades")} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {propertyStatusData.map((item) => (
            <div key={item.name} className="rounded-3xl border p-4">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-muted-foreground text-sm">{item.name}</p>
              </div>
              <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="bg-background rounded-4xl border p-8 shadow-sm">
        <p className="text-sm tracking-[0.22em] text-sky-700 uppercase">Embudo</p>
        <h3 className="mt-3 text-2xl font-semibold">Pipeline de transacciones</h3>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={transactionStageData} barCategoryGap={18}>
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <Tooltip
                formatter={(value) =>
                  formatTooltipValue(value as number | string | undefined, "Transacciones")
                }
              />
              <Bar dataKey="value" radius={[14, 14, 0, 0]}>
                {transactionStageData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-muted-foreground mt-4 text-sm leading-7">
          El gráfico compara la carga operativa activa por etapa y ayuda a detectar cuellos de
          botella antes del cierre.
        </p>
      </article>
    </section>
  );
}
