// Afirmaciones positivas en español
const affirmations = [
  "Soy luz, soy paz, soy suficiente",
  "Cada día es una nueva oportunidad para ser mejor",
  "Mi potencial es ilimitado y mis sueños son posibles",
  "Merezco amor, éxito y felicidad",
  "Mis acciones hoy crean mi mañana exitoso",
  "Soy fuerte, valiente y capaz de lograr cualquier cosa",
  "La gratitud transforma mi vida en abundancia",
  "Mi mente es poderosa y mi espíritu es indestructible",
  "Elijo ser feliz y vivir con propósito",
  "Soy digno de todos los logros que deseo alcanzar",
  "La adversidad me fortalece y me hace más sabio",
  "Tengo el poder de cambiar mi vida hoy",
  "Mi energía es contagiosa y atrae lo positivo",
  "Soy versátil, valioso y estoy en constante crecimiento",
  "Cada desafío es una oportunidad para brillar",
  "Mi mente está llena de posibilidades infinitas",
  "Soy creador de mi propio destino y éxito",
  "La paz interior es mi derecho natural",
  "Soy generador de cambio positivo en el mundo",
  "Hoy elijo amor, esperanza y acción",
];

export async function GET(request) {
  try {
    // Obtener afirmación aleatoria
    const randomIndex = Math.floor(Math.random() * affirmations.length);
    const affirmation = affirmations[randomIndex];

    return Response.json({
      affirmation,
      date: new Date().toLocaleDateString('es-ES'),
    });
  } catch (error) {
    console.error('Error al obtener afirmación:', error);
    return Response.json(
      { error: 'Error al obtener la afirmación' },
      { status: 500 }
    );
  }
}
