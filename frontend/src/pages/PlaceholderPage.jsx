export default function PlaceholderPage({ title, icon, description }) {
  return (
    <section className="p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 text-primary rounded-xl p-3 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">{icon}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-secondary">Página del sistema</span>
            <h2 className="text-3xl font-extrabold text-on-surface dark:text-slate-100 mt-1">{title}</h2>
            <p className="text-on-surface-variant dark:text-slate-400 mt-2 max-w-2xl">{description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <span className="material-symbols-outlined text-primary">widgets</span>
          <h3 className="font-bold mt-3">Contenido modular</h3>
          <p className="text-sm text-secondary mt-2">Sustituye este bloque por las tarjetas, tablas o formularios propios de esta sección.</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <span className="material-symbols-outlined text-primary">route</span>
          <h3 className="font-bold mt-3">Ruta independiente</h3>
          <p className="text-sm text-secondary mt-2">Cada opción del menú tiene su propia URL y puede convertirse en una página completa.</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <span className="material-symbols-outlined text-primary">sync_alt</span>
          <h3 className="font-bold mt-3">Navegación SPA</h3>
          <p className="text-sm text-secondary mt-2">La transición entre páginas se hace sin recargar todo el documento HTML.</p>
        </div>
      </div>
    </section>
  );
}
