export interface Scene {
  id: string;
  label: string;      // short period name
  range: string;      // human hour range
  startHour: number;  // inclusive
  endHour: number;    // exclusive (may wrap past midnight)
  headline: string;   // the "what this hour feels like" line
  detail: string;     // longer mood description
  image?: string;     // full-bleed photo background (in /public)
  palette: {
    sky: string;      // window gradient top
    horizon: string;  // window gradient bottom
    room: string;     // wall / room tone
    glow: string;     // monitor + accent glow
    ink: string;      // primary text
    muted: string;    // secondary text
  };
}

// Ordered by the hour they begin. Lookup wraps around midnight.
export const SCENES: Scene[] = [
  {
    id: "deep-night",
    label: "Deep Night",
    range: "12am – 4am",
    startHour: 0,
    endHour: 4,
    headline: "Peak flow. The bug finally makes sense at 3am.",
    detail:
      "The whole building is asleep. Just you, the fan hum, and a terminal that finally went green. Nobody will Slack you back until morning, and that is exactly why the work is good right now.",
    image: "/scenes/deep-night.jpg",
    palette: {
      sky: "#05070f",
      horizon: "#0b1024",
      room: "#0d1220",
      glow: "#3b6ea5",
      ink: "#dce6f5",
      muted: "#6b7a93",
    },
  },
  {
    id: "dawn",
    label: "Dawn",
    range: "4am – 7am",
    startHour: 4,
    endHour: 7,
    headline: "You said one more commit three hours ago.",
    detail:
      "The sky outside has gone from black to a bruised blue. Birds are starting. You are somewhere between a breakthrough and a very bad decision, and the coffee has gone cold in the mug.",
    image: "/scenes/dawn.jpg",
    palette: {
      sky: "#1a2340",
      horizon: "#c98a6b",
      room: "#242b3d",
      glow: "#e0a26f",
      ink: "#f0e6dc",
      muted: "#9c8f86",
    },
  },
  {
    id: "morning",
    label: "Morning",
    range: "7am – 11am",
    startHour: 7,
    endHour: 11,
    headline: "Standup in ten minutes. Camera off, obviously.",
    detail:
      "Hard daylight through the window now. Fresh coffee, unread notifications, and the quiet dread of saying what you did yesterday out loud. The desk looks almost respectable in this light.",
    image: "/scenes/morning.jpg",
    palette: {
      sky: "#8fb8e0",
      horizon: "#e8ddc7",
      room: "#d8d2c4",
      glow: "#f2b45c",
      ink: "#f4ede2",
      muted: "#b5ab9c",
    },
  },
  {
    id: "afternoon",
    label: "Afternoon",
    range: "11am – 4pm",
    startHour: 11,
    endHour: 16,
    headline: "The post-lunch dead zone. Nothing compiles, including you.",
    detail:
      "Flat, bright, slightly too warm. This is the hour of staring at a function you wrote an hour ago like a stranger left it there. The rubber duck is judging you. So is the linter.",
    image: "/scenes/afternoon.jpg",
    palette: {
      sky: "#b7d3e8",
      horizon: "#efe7d2",
      room: "#e4dccb",
      glow: "#e8964a",
      ink: "#f3ece0",
      muted: "#b3a996",
    },
  },
  {
    id: "dusk",
    label: "Dusk",
    range: "4pm – 7pm",
    startHour: 16,
    endHour: 19,
    headline: "Golden hour on the keyboard. Second wind incoming.",
    detail:
      "The light goes amber and long across the desk. The office-hours crowd is logging off, the pressure lifts, and suddenly the thing you were stuck on all day feels solvable again.",
    image: "/scenes/dusk.jpg",
    palette: {
      sky: "#e89a5c",
      horizon: "#d16b52",
      room: "#3f3242",
      glow: "#f0a955",
      ink: "#f5e9dd",
      muted: "#b59a8c",
    },
  },
  {
    id: "night",
    label: "Night",
    range: "7pm – 12am",
    startHour: 19,
    endHour: 24,
    headline: "Everyone logged off. This is when it gets good.",
    detail:
      "Room dark except for the monitor. The city glows outside, the notifications have stopped, and the editor is the brightest thing in your life right now. Just you and the problem, the way you like it.",
    image: "/scenes/night.jpg",
    palette: {
      sky: "#0a0f1e",
      horizon: "#141b30",
      room: "#11161f",
      glow: "#4d7fb8",
      ink: "#e2e9f4",
      muted: "#66718a",
    },
  },
];

export function sceneForHour(hour: number): Scene {
  // normalize 0-23
  const h = ((hour % 24) + 24) % 24;
  for (const s of SCENES) {
    const start = s.startHour;
    const end = s.endHour;
    if (end <= 24) {
      if (h >= start && h < end) return s;
    } else {
      // wraps midnight, e.g. 19 -> 25 means 19..23 or 0..0
      if (h >= start || h < end - 24) return s;
    }
  }
  return SCENES[SCENES.length - 1];
}
