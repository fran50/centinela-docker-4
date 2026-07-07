export const summaryCards = [
  {
    title: "Aulas operativas",
    value: "6/6",
    icon: "check_circle",
    iconClass: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
    detail: "100% funcional",
    detailIcon: "trending_up",
    detailClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Ocupación actual",
    value: "4/6",
    suffix: "aulas",
    icon: "groups",
    iconClass: "text-primary bg-primary/10",
    progress: 66,
  },
  {
    title: "Alertas activas",
    value: "0",
    icon: "info",
    iconClass: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
    detail: "Sin incidencias detectadas",
  },
  {
    title: "Estado puertas",
    value: "12",
    suffix: "cerradas",
    suffixClass: "text-emerald-500",
    icon: "door_front",
    iconClass: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
    detail: "0 abiertas actualmente",
  },
  {
    title: "Consumo energía hoy",
    value: "15.4",
    suffix: "kWh",
    icon: "bolt",
    iconClass: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
    detail: "+5% frente a ayer",
    detailIcon: "trending_up",
    detailClass: "text-red-500",
  },
  {
    title: "Confort ambiental",
    value: "21.5 ºC",
    suffix: "/ 45%",
    icon: "thermostat",
    iconClass: "text-primary bg-primary/10",
    detail: "Nivel óptimo",
    detailIcon: "water_drop",
  },
];

export const occupancyByHour = [
  { label: "08h", value: 20 },
  { label: "09h", value: 60 },
  { label: "10h", value: 90 },
  { label: "11h", value: 100 },
  { label: "12h", value: 85 },
  { label: "13h", value: 50 },
];

export const classrooms = [
  { name: "Aula 1", floor: 0, status: "operational" },
  { name: "Aula 2", floor: 0, status: "operational" },
  { name: "Aula 3", floor: 0, status: "operational" },
  { name: "Aula 4", floor: 1, status: "warning", detail: "Aviso" },
  { name: "Aula 5", floor: 1, status: "operational" },
  { name: "Aula 6", floor: 1, status: "operational" },
];
