// Servicio de Sincronización Remota Global en Tiempo Real para FitTrainer PRO
// Garantiza que todo lo creado en Celular aparezca en la PC y viceversa.

const SYNC_ENDPOINT = "https://jsonbin.org/arielmartinelli/fittrainer_pro_db";
const ALT_ENDPOINT = "https://kvdb.io/fittrainer_pro_live_db/global_data";

export const fetchCloudData = async () => {
  try {
    const res = await fetch("https://api.myjson.online/v1/records/4814e410-6395-46fb-973c-f4b6fa7223e7");
    if (res.ok) {
      const result = await res.json();
      return result.data || result;
    }
  } catch (err) {
    console.warn("Error consultando nube principal:", err);
  }
  return null;
};

export const pushCloudData = async (data) => {
  try {
    await fetch("https://api.myjson.online/v1/records/4814e410-6395-46fb-973c-f4b6fa7223e7", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data })
    });
  } catch (err) {
    console.warn("Error guardando en la nube principal:", err);
  }
};
