// Frases motivacionales de productividad de grandes pensadores y filósofos

export const MOTIVATIONAL_QUOTES = [
    { text: "El genio es 1% inspiración y 99% transpiración.", author: "Thomas Edison" },
    { text: "La única forma de hacer un gran trabajo es amar lo que haces.", author: "Steve Jobs" },
    { text: "Conocerse a sí mismo es el principio de toda sabiduría.", author: "Aristóteles" },
    { text: "El tiempo es el recurso más valioso que tenemos.", author: "Benjamin Franklin" },
    { text: "No cuentes los días, haz que los días cuenten.", author: "Muhammad Ali" },
    { text: "La disciplina es el puente entre metas y logros.", author: "Jim Rohn" },
    { text: "Somos lo que hacemos repetidamente.", author: "Aristóteles" },
    { text: "La vida no vivida no vale la pena ser examinada.", author: "Sócrates" },
    { text: "La acción es la clave fundamental de todo éxito.", author: "Pablo Picasso" },
    { text: "Empieza haciendo lo necesario, luego lo posible.", author: "San Francisco de Asís" },
    { text: "El secreto de progresar es empezar.", author: "Mark Twain" },
    { text: "La perseverancia no es una carrera larga; es muchas carreras cortas.", author: "Walter Elliot" },
    { text: "No hay viento favorable para quien no sabe a dónde va.", author: "Séneca" },
    { text: "Un viaje de mil millas comienza con un solo paso.", author: "Lao Tse" },
    { text: "El trabajo duro vence al talento cuando el talento no trabaja duro.", author: "Tim Notke" },
] as const

export type MotivationalQuote = typeof MOTIVATIONAL_QUOTES[number]

export function getRandomQuote(): MotivationalQuote {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
    return MOTIVATIONAL_QUOTES[randomIndex]
}
