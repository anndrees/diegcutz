// Dedicated messaging scope: never intercepts or caches customer navigations.
export async function getPushRegistration(create = false): Promise<ServiceWorkerRegistration | undefined> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  const scriptUrl = new URL("/sw-push.js", location.origin).href;
  const existing = registrations.find(reg =>
    [reg.active, reg.waiting, reg.installing].some(worker => worker?.scriptURL === scriptUrl),
  );
  if (!existing && !create) return undefined;
  const registration = existing ?? await navigator.serviceWorker.register("/sw-push.js", { scope: "/push/" });
  if (registration.active) return registration;
  const worker = registration.installing ?? registration.waiting;
  if (!worker) throw new Error("No se pudo iniciar el servicio de notificaciones");
  await new Promise<void>((resolve, reject) => {
    const finish = () => {
      clearTimeout(timer);
      worker.removeEventListener("statechange", changed);
    };
    const changed = () => {
      if (worker.state === "activated") { finish(); resolve(); }
      else if (worker.state === "redundant") { finish(); reject(new Error("Servicio de notificaciones no disponible")); }
    };
    const timer = window.setTimeout(() => { finish(); reject(new Error("Servicio de notificaciones agotó el tiempo de espera")); }, 15000);
    worker.addEventListener("statechange", changed);
    changed();
  });
  return registration;
}