// Seeds clearly-labeled FICTIONAL demo profiles so Discover/Matches feel
// populated during development and testing. These are never real members —
// each one is marked is_demo = true in the database (which renders a
// "Demo profile" badge everywhere the app shows a profile), and each bio
// also states in plain text that it's a demo, not a real person.
//
// Usage (from the project root, with your real .env.local in place):
//   node scripts/seed-demo-profiles.mjs
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from
// .env.local. Safe to re-run — it skips any demo account whose email
// already exists.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { randomUUID } from "node:crypto";

function loadEnvLocal() {
  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // No .env.local — fall through to whatever is already in process.env.
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add your real .env.local first."
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_TAG = "(Demo profile for testing — not a real member.)";

// city_id matches the fixed seed order in schema.sql:
// 1 Houston, 2 Austin, 3 Dallas, 4 San Antonio
const DEMO_PROFILES = [
  {
    email: "demo.maddie@saddlematch.invalid",
    display_name: "Maddie",
    birthdate: "1998-04-12",
    gender: "female",
    interested_in: ["male"],
    city_id: 2,
    bio: `Two-stepping on weekends, queso enthusiast. ${DEMO_TAG}`,
    interests: ["country music", "line dancing", "tex-mex"],
    prompts: [
      { question: "Best local spot for a first date…", answer: "Nickel City, for pool and good queso." },
      { question: "My Texas summer survival kit includes…", answer: "SPF 50, a good hat, and a sno-cone budget." },
      { question: "Ask me about…", answer: "The time I two-stepped for six hours straight at ACL." },
    ],
  },
  {
    email: "demo.colt@saddlematch.invalid",
    display_name: "Colt",
    birthdate: "1995-09-03",
    gender: "male",
    interested_in: ["female"],
    city_id: 2,
    bio: `Weekend rodeo hand, weekday software guy. ${DEMO_TAG}`,
    interests: ["rodeo", "hiking", "live music"],
    prompts: [
      { question: "Unpopular opinion I'll defend…", answer: "Breakfast tacos beat breakfast burritos, always." },
      { question: "Green flag I look for…", answer: "You already have a favorite honky-tonk." },
      { question: "Dating me is like…", answer: "A two-step — a little structure, a lot of fun." },
    ],
  },
  {
    email: "demo.priya@saddlematch.invalid",
    display_name: "Priya",
    birthdate: "1997-01-22",
    gender: "female",
    interested_in: ["male", "nonbinary"],
    city_id: 1,
    bio: `Houston born, boots always by the door. ${DEMO_TAG}`,
    interests: ["cooking", "country music", "running"],
    prompts: [
      { question: "My simple pleasures are…", answer: "Fresh tortillas and a good playlist." },
      { question: "Sunday mornings look like…", answer: "Farmers market, then a long run by the bayou." },
      { question: "I geek out on…", answer: "True crime podcasts and BBQ smoking techniques." },
    ],
  },
  {
    email: "demo.jordan@saddlematch.invalid",
    display_name: "Jordan",
    birthdate: "1994-06-17",
    gender: "male",
    interested_in: ["female"],
    city_id: 1,
    bio: `Rodeo season is my Christmas. ${DEMO_TAG}`,
    interests: ["rodeo", "grilling", "college football"],
    prompts: [
      { question: "A life goal of mine is…", answer: "Catching every stop of the Houston rodeo, every year." },
      { question: "Overshare something…", answer: "I've cried at the Houston Livestock Show. More than once." },
      { question: "Best local spot for a first date…", answer: "Truck stop tacos, then a walk downtown." },
    ],
  },
  {
    email: "demo.casey@saddlematch.invalid",
    display_name: "Casey",
    birthdate: "1996-11-05",
    gender: "nonbinary",
    interested_in: ["male", "female", "nonbinary"],
    city_id: 3,
    bio: `Dallas native, country radio on repeat. ${DEMO_TAG}`,
    interests: ["country music", "vintage boots", "brunch"],
    prompts: [
      { question: "The way to win me over is…", answer: "Know all the words to a George Strait song." },
      { question: "My friends would describe me as…", answer: "The one who plans every road trip playlist." },
      { question: "I'm convinced that…", answer: "Every good story starts at a honky-tonk." },
    ],
  },
  {
    email: "demo.wyatt@saddlematch.invalid",
    display_name: "Wyatt",
    birthdate: "1993-03-29",
    gender: "male",
    interested_in: ["female"],
    city_id: 3,
    bio: `Third-generation Dallas rancher's kid. ${DEMO_TAG}`,
    interests: ["horses", "barbecue", "old trucks"],
    prompts: [
      { question: "Two truths and a lie…", answer: "I've broken a horse. I hate boots. I make a mean brisket." },
      { question: "Dating me is like…", answer: "A slow two-step, not a sprint." },
      { question: "Ask me about…", answer: "Restoring my granddad's old Ford." },
    ],
  },
  {
    email: "demo.sierra@saddlematch.invalid",
    display_name: "Sierra",
    birthdate: "1999-07-14",
    gender: "female",
    interested_in: ["male"],
    city_id: 4,
    bio: `San Antonio raised, river walks and rodeo nights. ${DEMO_TAG}`,
    interests: ["dancing", "tex-mex", "live music"],
    prompts: [
      { question: "My Texas summer survival kit includes…", answer: "A fan, a float tube, and good sunglasses." },
      { question: "Unpopular opinion I'll defend…", answer: "Puffy tacos are superior to regular tacos." },
      { question: "Green flag I look for…", answer: "Willing to two-step even if they're bad at it." },
    ],
  },
  {
    email: "demo.beau@saddlematch.invalid",
    display_name: "Beau",
    birthdate: "1992-12-08",
    gender: "male",
    interested_in: ["female"],
    city_id: 4,
    bio: `San Antonio through and through. Boots, not sneakers. ${DEMO_TAG}`,
    interests: ["country music", "fishing", "grilling"],
    prompts: [
      { question: "I'm convinced that…", answer: "A good pair of boots lasts longer than most relationships." },
      { question: "Best local spot for a first date…", answer: "The River Walk, then somewhere with live music." },
      { question: "My friends would describe me as…", answer: "Reliable, a little stubborn, always down for a road trip." },
    ],
  },
];

async function seed() {
  const { data: existingUsers } = await admin.auth.admin.listUsers();

  for (const p of DEMO_PROFILES) {
    const already = existingUsers?.users?.find((u) => u.email === p.email);

    let userId = already?.id;

    if (!userId) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: p.email,
        email_confirm: true,
        password: randomUUID(),
        user_metadata: { is_demo: true },
      });
      if (createErr) {
        console.error(`Failed to create auth user for ${p.display_name}:`, createErr.message);
        continue;
      }
      userId = created.user.id;
    }

    const { error: profileErr } = await admin.from("profiles").upsert({
      id: userId,
      display_name: p.display_name,
      birthdate: p.birthdate,
      gender: p.gender,
      interested_in: p.interested_in,
      city_id: p.city_id,
      bio: p.bio,
      interests: p.interests,
      prompts: p.prompts,
      photo_urls: [],
      is_active: true,
      is_demo: true,
    });

    if (profileErr) {
      console.error(`Failed to upsert profile for ${p.display_name}:`, profileErr.message);
      continue;
    }

    console.log(`Seeded demo profile: ${p.display_name} (${p.city_id})`);
  }

  console.log("Done. Demo profiles are marked is_demo = true and show a 'Demo profile' badge in the app.");
}

seed();
