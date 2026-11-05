export const identity = {
  name: "Shruti Thakur",
  shortName: "Shruti",
  location: "Thane, Maharashtra",
  email: "sthakur.shruti@gmail.com",
  formRecipient: "1729.shruti@gmail.com",
  github: "https://github.com/ShrutiThakur1729",
  linkedin: "https://www.linkedin.com/in/shruti-t-694467279/",
  jls: "https://jlstech.io/home",
  resume: "/assets/resume.pdf",
  tagline: "A little universe called Shruti",
};

export const introduction =
  "I'm Shruti, an Information Technology student with Honors in Artificial Intelligence & Machine Learning. I enjoy turning ideas into useful technology through AI-powered applications, full-stack development and accessible software experiences. This little universe brings together the work I've built, the things I love and the journey still unfolding.";

export const professionalSummary =
  "B.E. Information Technology student with Honors in Artificial Intelligence & Machine Learning, specializing in AI-powered application development, full-stack development, and accessible software solutions. Experienced in building innovative applications through academic projects, hackathons, and industry experience. Seeking Software Engineering, AI, and Product Development opportunities.";

export const education = [
  {
    institution: "A. P. Shah Institute of Technology",
    location: "Thane, Maharashtra",
    qualification: "B.E. in Information Technology",
    detail: "Honors in Artificial Intelligence & Machine Learning",
    grade: "CGPA 9.35 (Semester V)",
    period: "Expected graduation May 2027",
  },
  {
    institution: "IIT Madras",
    location: "Online",
    qualification: "BS Degree in Data Science and Applications",
    detail: "",
    grade: "",
    period: "2024 – Present",
  },
];

export const skills = [
  { group: "Programming Languages", items: ["C", "Python", "Java", "JavaScript"] },
  { group: "Web & Mobile Development", items: ["React", "Flutter", "HTML", "CSS"] },
  { group: "Backend Development", items: ["Node.js", "Express.js"] },
  { group: "Databases", items: ["MySQL", "MongoDB", "Firebase", "Supabase"] },
  {
    group: "Cybersecurity",
    items: ["OWASP", "Burp Suite", "Nmap", "Wireshark", "SQLMap", "Linux"],
  },
  { group: "AI & APIs", items: ["Google Gemini API", "Hugging Face"] },
  { group: "Cloud & Deployment", items: ["AWS", "Netlify", "Vercel"] },
  { group: "Tools & IDEs", items: ["Git", "GitHub", "VS Code", "PyCharm"] },
  { group: "UI/UX Design", items: ["Figma", "Canva"] },
];

export type Project = {
  id: string;
  name: string;
  subtitle: string;
  url: string;
  description: string;
  technologies: string[];
  event?: string;
  result?: string;
  art: "shield" | "speech" | "market" | "ecology" | "cosmic";
};

export const projects: Project[] = [
  {
    id: "argus",
    name: "ARGUS",
    subtitle: "AI Cyber Resilience Platform",
    url: "https://argus-core.netlify.app/login",
    description:
      "AI-driven cybersecurity platform for automated threat analysis, security workflows and resilient system architecture.",
    technologies: ["Python", "FastAPI", "AI Agents", "Security Automation"],
    event: "Economic Times AI Hackathon 2.0",
    result: "Semi-finalist",
    art: "shield",
  },
  {
    id: "accessbridge",
    name: "AccessBridge AI",
    subtitle: "Multilingual AI Assistant",
    url: "https://access-bridge-ai.web.app/",
    description:
      "Multilingual AI mobile assistant integrating speech recognition, language processing and AI assistance to improve access to digital services.",
    technologies: ["Flutter", "Firebase", "Gemini API", "Speech Recognition"],
    event: "AWS AI for Bharat Hackathon",
    result: "Prototype Phase",
    art: "speech",
  },
  {
    id: "samhita",
    name: "Samhita",
    subtitle: "AI Marketplace",
    url: "https://samhita-ai.netlify.app/",
    description:
      "AI-powered marketplace connecting artisans with buyers through assisted onboarding, product discovery and digital commerce workflows.",
    technologies: ["React", "Firebase", "Gemini API", "Voice AI"],
    event: "Google Gen AI Exchange Hackathon 2.0",
    result: "Semi-finalist",
    art: "market",
  },
  {
    id: "urban-ecology",
    name: "Urban Ecology Compiler",
    subtitle: "AI Geospatial Decision-Support System",
    url: "https://urbanecologycompiler.netlify.app/",
    description:
      "Budget-constrained geospatial decision support for ecological interventions, with flood resilience as the primary objective and a ₹10 lakh planning budget.",
    technologies: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "MapLibre GL JS",
      "GeoJSON",
      "Turf.js",
      "Gemini API",
      "OpenStreetMap/Overpass",
      "Copernicus Sentinel",
      "Open-Meteo",
      "OpenElevation/SRTM",
    ],
    event: "All You Can Do with AI 2026",
    result: "Winner",
    art: "ecology",
  },
  {
    id: "cosmic",
    name: "COSMIC Data Fusion",
    subtitle: "Astronomical Data Fusion Project",
    url: "https://cosmicdatafusion.netlify.app/",
    description:
      "An astronomical data-fusion project — fusing observations to reveal more of the sky than any single dataset can.",
    technologies: [],
    art: "cosmic",
  },
];

export const experience = [
  {
    role: "AI Engineering Intern",
    company: "AlgoForce AI",
    period: "July 2026 – September 2026",
    url: "",
    points: [
      "Optra — AI-powered operations copilot",
      "FORGE — AI-driven startup orchestration platform",
      "Vibe — Gen-Z social mobile platform using AI to translate digital intent into personalised real-world connections",
    ],
  },
  {
    role: "Full-Stack Development (project-based)",
    company: "JLS Technologies LLP",
    period: "2026",
    url: "https://jlstech.io/home",
    points: [
      "Developed and deployed production web applications, PWAs, cloud infrastructure and digital solutions from concept to deployment.",
    ],
  },
];

export const virtualInternships = [
  { name: "Palo Alto Cybersecurity Virtual Internship", provider: "AICTE & Palo Alto Networks" },
  { name: "Ethical Hacking Virtual Internship", provider: "AICTE" },
  { name: "AWS Data Engineering Virtual Internship", provider: "AICTE & AWS" },
  { name: "Juniper Networks Virtual Internship", provider: "AICTE & Juniper Networks" },
  { name: "NPTEL Certification in Database Management Systems", provider: "NPTEL" },
  { name: "Python 3.4.3 Training", provider: "Spoken Tutorial Project, IIT Bombay" },
];

export const achievements = [
  "All You Can Do with AI — Winner",
  "Practice and Create — Winner",
  "Google Gen AI Exchange Hackathon 2.0 (2025) — Semi-finalist, selected for Prototype Development",
  "Economic Times AI Hackathon 2.0 (2026) — Qualified for Prototype Development Phase",
  "AWS AI for Bharat Hackathon (2026) — Advanced to Prototype Development Phase",
  "NAKSHATRA National Hackathon (2026) — Qualified for semi-finals of the 24-hour national-level hackathon",
  "Smart India Hackathon (2024) — Qualified through Institute-Level Selection Round",
  "GDG on Campus APSIT TechSprint (2025) — Top 15, Open Innovation Track",
  "Published Poet — Featured in a Notion Press publication",
  "Runner-up — APSIT Chess Competition (2025)",
  "Runner-up — World Water Day Slogan Writing Competition (2023)",
];

export const leadership = [
  "Literature Head — GDG on Campus APSIT (2024–25)",
  "Content Head — IEEE APSIT (2024–25)",
  "Treasurer — ITSA, APSIT (2025–26)",
  "Host and Anchor — APSIT events including OjUS Fest 2024 and 2025",
];

export const volunteering = [
  {
    role: "Digital Marketing & Fundraising Intern",
    org: "Muskurahat Foundation",
    detail: "Supported education campaigns and raised ₹17,070 in one month",
  },
  {
    role: "Core Team Member",
    org: "Google Developers Group Cloud Mumbai",
    detail: "Event management, speaker coordination and anchoring",
  },
  {
    role: "Volunteer Photographer",
    org: "ITSA, APSIT",
    detail: "Covered departmental events including IT Week",
  },
];

export type Book = {
  id: string;
  title: string;
  author: string;
  cover: string;
  pages: { heading: string; body: string[] }[];
};

export const books: Book[] = [
  {
    id: "story",
    title: "The Story",
    author: "Shruti Thakur",
    cover: "forest",
    pages: [
      {
        heading: "Hello",
        body: [introduction],
      },
      {
        heading: "What I do",
        body: [
          professionalSummary,
          "Based in Thane, Maharashtra, studying at A. P. Shah Institute of Technology.",
        ],
      },
      {
        heading: "Why this universe",
        body: [
          "Portfolios usually read like lists. This one is a place instead — a valley for a first hello, a castle for the work, a garden for the quieter things, and an open door to reach me.",
          "Every fact here is real. Nothing in this universe is invented.",
        ],
      },
    ],
  },
  {
    id: "academic",
    title: "The Academic Journey",
    author: "Shruti Thakur",
    cover: "ocean",
    pages: [
      {
        heading: "A. P. Shah Institute of Technology",
        body: [
          "B.E. in Information Technology, with Honors in Artificial Intelligence & Machine Learning.",
          "CGPA 9.35 (Semester V) · Expected graduation May 2027 · Thane, Maharashtra.",
        ],
      },
      {
        heading: "IIT Madras",
        body: [
          "BS Degree in Data Science and Applications (online), 2024 – Present.",
          "Studied alongside the B.E. degree — data structures to machine learning.",
        ],
      },
      {
        heading: "Certifications along the way",
        body: [
          "NPTEL certification in Database Management Systems.",
          "Python 3.4.3 Training — Spoken Tutorial Project, IIT Bombay.",
          "Virtual internships: Palo Alto Cybersecurity (AICTE & Palo Alto Networks), Ethical Hacking (AICTE), AWS Data Engineering (AICTE & AWS), Juniper Networks (AICTE & Juniper Networks).",
        ],
      },
    ],
  },
  {
    id: "workshop",
    title: "The Workshop",
    author: "Technical Skills",
    cover: "ember",
    pages: skills.map((s) => ({
      heading: s.group,
      body: [s.items.join("  ·  ")],
    })),
  },
  {
    id: "experience",
    title: "The Experience Journal",
    author: "Shruti Thakur",
    cover: "rose",
    pages: [
      {
        heading: "AlgoForce AI — AI Engineering Intern",
        body: [
          "July 2026 – September 2026.",
          "Contributed to Optra, an AI-powered operations copilot; FORGE, an AI-driven startup orchestration platform; and Vibe, a Gen-Z social mobile platform using AI to translate digital intent into personalised real-world connections.",
        ],
      },
      {
        heading: "JLS Technologies LLP",
        body: [
          "Full-Stack Development, project-based, 2026.",
          "Developed and deployed production web applications, PWAs, cloud infrastructure and digital solutions from concept to deployment.",
          "jlstech.io/home",
        ],
      },
      {
        heading: "Virtual internships",
        body: virtualInternships.map((v) => `${v.name} — ${v.provider}`),
      },
    ],
  },
  {
    id: "achievements",
    title: "The Hall of Achievements",
    author: "Shruti Thakur",
    cover: "gold",
    pages: [
      {
        heading: "Hackathons & competitions",
        body: achievements.slice(0, 6),
      },
      {
        heading: "Beyond the podium",
        body: achievements.slice(6),
      },
    ],
  },
  {
    id: "people",
    title: "People & Communities",
    author: "Shruti Thakur",
    cover: "forest",
    pages: [
      {
        heading: "Leadership",
        body: leadership,
      },
      {
        heading: "Volunteering",
        body: volunteering.map((v) => `${v.role}, ${v.org} — ${v.detail}`),
      },
    ],
  },
];

export const poems = [
  {
    title: "Glittering Desire",
    text: `The lights were glittering,
just like stars twinkling in the dark sky,

I was standing on the stage astound,
and everybody found,

Ones who disparaged me,
now cherished me,
I looked around the Crowd,
and saw myself profound,

It was something that I wished,
And that moment enriched it,

Hours of hardwork made through it,
I was honored with a reward and lots of
apwwplaud,

That’s where my beautiful dream Halt.....

It woke me when the sun was smiling,
When birds were whistling,
When trees were shimmering,
Just how my dream was glittering.`,
  },
  {
    title: "The Last Day on Planet Earth",
    text: `It was Brick and Bitter cold,
As it was told,

The Sky was Dark gray,
And no one was at bay,

The Climate was erratic,
And the sight was traumatic,

The Glaciers were melting down,
And the flood drown the town,

No Trees, No house could be found,
As everything was razed to ground,

The Birds lost their way,
It was end of the day,

Not even Sun was there to wave,
The land turned into a "Human grave",

People could only Pray,
While the "Lethal Asteroid" was at it’s way,

This was the sight,
"While we were at our Planet",
The Earth was left with lonely nights......

But the END gave BIRTH,
The Nature formed another "EARTH".`,
  },
];

export const poetryCredit =
  "Shruti is a published poet, featured in a Notion Press publication.";

export const reading = {
  title: "The Alchemist",
  author: "Paulo Coelho",
  cover: "/assets/alchemist.jpg",
  note: "Currently reading — featured in the Memory Garden's reading nook.",
};

export const soundtrack = {
  title: "Magic Shop",
  artist: "BTS",
  spotify: "https://open.spotify.com/embed/track/5MTGPkmiUuud9NkA0sl2nI?utm_source=generator&theme=0",
  note: "Her personal soundtrack selection. The garden's own music fades out while this plays.",
};

export const gardenNotes: Record<
  string,
  { title: string; body: string[] }
> = {
  imagination: {
    title: "Imagination",
    body: [
      poetryCredit,
      "Two of her poems are kept in the Poetry Nook, exactly as they were written.",
    ],
  },
  creative: {
    title: "Creative Corner",
    body: [
      "Runner-up — APSIT Chess Competition (2025).",
      "Runner-up — World Water Day Slogan Writing Competition (2023).",
      "Volunteer Photographer — ITSA, APSIT; covered departmental events including IT Week.",
    ],
  },
  memories: {
    title: "Memories & Moments",
    body: [
      "Host and Anchor — APSIT events including OjUS Fest 2024 and 2025.",
      "Literature Head — GDG on Campus APSIT (2024–25).",
      "Content Head — IEEE APSIT (2024–25).",
      "Treasurer — ITSA, APSIT (2025–26).",
    ],
  },
  inspiration: {
    title: "Inspiration",
    body: [
      "Digital Marketing & Fundraising Intern — Muskurahat Foundation; supported education campaigns and raised ₹17,070 in one month.",
      "Core Team Member — Google Developers Group Cloud Mumbai.",
      "Her reading and soundtrack choices live at the ends of this garden.",
    ],
  },
};
