export type NarrationSeq = { id: string; lines: string[] };

export const narrationScripts: Record<string, string[]> = {
  welcome: [
    "Welcome, traveller. This is a little universe called Shruti — a valley, a castle and a garden, built from one person's real work.",
    "Follow me and I'll walk you through it. Or wander freely; the atlas is always in your pocket.",
  ],
  hello: [
    "Every story begins somewhere. This valley is called The First Hello — welcome to The World Inside.",
    "Follow the stone path, beneath the trees and through the old gateway. There is time to look around.",
    "Somewhere past the bridge, an old journal waits on a pedestal — it will tell you who Shruti is.",
    "She is an Information Technology student with Honors in Artificial Intelligence and Machine Learning.",
    "When you are ready, open the atlas and fly towards the castle on the hill.",
  ],
  castle: [
    "The Castle is where the work lives. It was built, stone by stone, from real projects and real milestones.",
    "Cross the moat and push the great doors. Inside, a gothic hall has been waiting for you.",
    "Two wings open from the hall: the Gallery of Creations, and the Living Archives.",
  ],
  hall: [
    "The great hall — candlelight, stained glass, and a staircase that has seen a hundred ideas walk up it.",
    "The west wing holds the Gallery of Creations. The east wing holds the Living Archives.",
  ],
  gallery: [
    "Five exhibits stand in this gallery. Each one is a real project you can visit — nothing here is decorative.",
    "Step close to a plinth and press E to read its story, then view the live project when you're ready.",
  ],
  library: [
    "The Living Archives. Six books, all true: her story, her academics, her skills, her experience, her achievements, and her people.",
    "Take a book from the shelf. It will open in your hands.",
  ],
  garden: [
    "The Memory Garden is the quietest place in this universe. Everything planted here is personal.",
    "Under the old tree there is a reading nook with a favourite book. Nearby, a desk holds two published poems.",
    "And by the hedge, a gramophone holds her personal soundtrack. Play it, and the garden will hush.",
    "Wander slowly. The fireflies don't mind.",
  ],
  opendoor: [
    "Every journey ends at a door. This one is open.",
    "Beyond it are real ways to reach Shruti — and a form that lands directly in her inbox.",
  ],
};

export const arrivalCaptions: Record<string, string> = {
  hello: "The First Hello — a lantern-lit valley.",
  castle: "The Castle — the work lives here.",
  garden: "The Memory Garden — the quietest place in this universe.",
};
