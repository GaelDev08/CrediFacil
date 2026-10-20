/**
 * Servicio para consultar la tasa oficial de cambio del Banco Central de Venezuela (BCV).
 * Consume la API pública oficial (dolarapi) que sincroniza en tiempo real con las publicaciones del BCV.
 */

export interface BcvRateResponse {
  rate: number;
  date: string;
  source: string;
  isFallback: boolean;
}

// Tasa de contingencia en caso de que el cliente esté sin conexión
export const FALLBACK_BCV_RATE = 881.88;

export async function fetchBcvRate(): Promise<BcvRateResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    const rate = Number(data.promedio || data.precio || data.venta || data.compra);

    if (isNaN(rate) || rate <= 0) {
      throw new Error('Tasa no válida devuelta por la API');
    }

    const dateStr = data.fechaActualizacion
      ? new Date(data.fechaActualizacion).toLocaleDateString('es-VE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      : new Date().toLocaleDateString('es-VE');

    return {
      rate: Math.round(rate * 100) / 100,
      date: dateStr,
      source: 'Banco Central de Venezuela (Oficial)',
      isFallback: false,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('No se pudo conectar a la API del BCV en vivo, utilizando tasa de referencia:', error);
    return {
      rate: FALLBACK_BCV_RATE,
      date: new Date().toLocaleDateString('es-VE'),
      source: 'Referencia BCV (Contingencia)',
      isFallback: true,
    };
  }
}
