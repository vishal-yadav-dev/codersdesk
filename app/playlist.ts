// Curated Bollywood playlist, grouped by time of day.
// Every `youtube` id below was resolved against YouTube search and verified
// with oembed — none are hand-typed or guessed. To add a song, append a row
// with its 11-char video id (the `v=` part of a watch URL).

export interface Track {
  id: string;
  scene: string;   // which time frame it plays in (see scenes.ts ids)
  title: string;
  artist: string;  // singers · film (year)
  youtube: string; // 11-char video id
}

export const PLAYLIST: Track[] = [
  { id: "tadap-tadap-ke",          scene: "deep-night", title: "Tadap Tadap Ke", artist: "KK · Hum Dil De Chuke Sanam (1999)", youtube: "KwiDJclWo44" },
  { id: "channa-mereya",           scene: "deep-night", title: "Channa Mereya", artist: "Arijit Singh · Ae Dil Hai Mushkil", youtube: "284Ov7ysmfA" },
  { id: "tujhe-bhula-diya",        scene: "deep-night", title: "Tujhe Bhula Diya", artist: "Mohit Chauhan · Anjaana Anjaani", youtube: "-Hb2DeHvvEg" },
  { id: "tera-hone-laga-hoon",     scene: "deep-night", title: "Tera Hone Laga Hoon", artist: "Atif Aslam · Ajab Prem Ki Ghazab Kahani", youtube: "rTuxUAuJRyY" },
  { id: "woh-lamhe",               scene: "deep-night", title: "Woh Lamhe", artist: "Atif Aslam · Zeher", youtube: "FLKxnL7KwHw" },
  { id: "chhoti-si-aasha",         scene: "dawn", title: "Chhoti Si Aasha", artist: "Minmini · Roja (1992)", youtube: "P2s1Cl23oik" },
  { id: "yeh-haseen-vadiyan",      scene: "dawn", title: "Yeh Haseen Vadiyan", artist: "S.P. Balasubrahmanyam · Roja", youtube: "5kZ5o-oM0RI" },
  { id: "tu-hi-re",                scene: "dawn", title: "Tu Hi Re", artist: "Hariharan · Bombay (1995)", youtube: "BFnQbgazL3g" },
  { id: "kehna-hi-kya",            scene: "dawn", title: "Kehna Hi Kya", artist: "K.S. Chithra · Bombay (1995)", youtube: "sl_Z8w_WsLo" },
  { id: "pehla-nasha",             scene: "dawn", title: "Pehla Nasha", artist: "Udit Narayan · Jo Jeeta Wohi Sikandar", youtube: "SBfPs-PMGTA" },
  { id: "chaiyya-chaiyya",         scene: "morning", title: "Chaiyya Chaiyya", artist: "Sukhwinder Singh · Dil Se (1998)", youtube: "K-pX4qwtAxA" },
  { id: "aati-kya-khandala",       scene: "morning", title: "Aati Kya Khandala", artist: "Ghulam (1998)", youtube: "EENnVk1_suc" },
  { id: "ruk-ja-o-dil-deewane",    scene: "morning", title: "Ruk Ja O Dil Deewane", artist: "Udit Narayan · DDLJ (1995)", youtube: "jBpRItrod-Q" },
  { id: "mehndi-laga-ke-rakhna",   scene: "morning", title: "Mehndi Laga Ke Rakhna", artist: "Udit Narayan · DDLJ (1995)", youtube: "-bNwqXvMuB8" },
  { id: "didi-tera-devar-deewana", scene: "morning", title: "Didi Tera Devar Deewana", artist: "Hum Aapke Hain Koun (1994)", youtube: "ZqcDGvCM_w0" },
  { id: "tip-tip-barsa-paani",     scene: "afternoon", title: "Tip Tip Barsa Paani", artist: "Udit Narayan, Alka Yagnik · Mohra (1994)", youtube: "VMsn5-a45-s" },
  { id: "chura-ke-dil-mera",       scene: "afternoon", title: "Chura Ke Dil Mera", artist: "Kumar Sanu · Main Khiladi Tu Anari (1994)", youtube: "Yqj1_V90KJo" },
  { id: "sona-kitna-sona-hai",     scene: "afternoon", title: "Sona Kitna Sona Hai", artist: "Udit Narayan · Hero No. 1 (1997)", youtube: "I6qPySAJWJs" },
  { id: "tenu-leke",               scene: "afternoon", title: "Tenu Leke", artist: "Sonu Nigam, Shreya · Salaam-e-Ishq (2007)", youtube: "Cu3QpWEfqgg" },
  { id: "what-is-mobile-number",   scene: "afternoon", title: "What Is Mobile Number", artist: "Govinda · Haseena Maan Jaayegi", youtube: "_QqOhN4VYfE" },
  { id: "tujhe-dekha-to",          scene: "dusk", title: "Tujhe Dekha To", artist: "Kumar Sanu, Lata Mangeshkar · DDLJ (1995)", youtube: "cNV5hLSa9H8" },
  { id: "tum-hi-ho",               scene: "dusk", title: "Tum Hi Ho", artist: "Arijit Singh · Aashiqui 2 (2013)", youtube: "81qmmlsIE3k" },
  { id: "tere-liye",               scene: "dusk", title: "Tere Liye", artist: "Lata Mangeshkar, Roop Kumar Rathod · Veer-Zaara", youtube: "jo6iAkSoraY" },
  { id: "pehli-nazar-mein",        scene: "dusk", title: "Pehli Nazar Mein", artist: "Atif Aslam · Race (2008)", youtube: "JBCx0QyP8VQ" },
  { id: "tum-jo-aaye",             scene: "dusk", title: "Tum Jo Aaye", artist: "Rahat Fateh Ali Khan · OUATIM", youtube: "y2O44HDZWws" },
  { id: "yeh-kaali-kaali-aankhen", scene: "night", title: "Yeh Kaali Kaali Aankhen", artist: "Kumar Sanu · Baazigar (1993)", youtube: "IhKXq5dhTag" },
  { id: "gerua",                   scene: "night", title: "Gerua", artist: "Arijit Singh, Antara · Dilwale (2015)", youtube: "AEIVhBS6baE" },
  { id: "dil-diyan-gallan",        scene: "night", title: "Dil Diyan Gallan", artist: "Atif Aslam · Tiger Zinda Hai (2017)", youtube: "JtnPpxe8K7c" },
  { id: "ankhiyon-se-goli-maare",  scene: "night", title: "Ankhiyon Se Goli Maare", artist: "Sonu Nigam, Jaspinder · Dulhe Raja", youtube: "llfkNB3rRTc" },
  { id: "chikni-chameli",          scene: "night", title: "Chikni Chameli", artist: "Shreya Ghoshal · Agneepath (2012)", youtube: "MQM7CNoAsBI" },
];

/** Tracks for a scene, falling back to the whole list if a scene has none. */
export function tracksForScene(sceneId: string): Track[] {
  const found = PLAYLIST.filter((t) => t.scene === sceneId);
  return found.length ? found : PLAYLIST;
}
