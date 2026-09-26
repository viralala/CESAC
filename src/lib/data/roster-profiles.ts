/**
 * The committee's own answers, for the profile pages under /people.
 *
 * Transcribed from "CESAC Roster (Form Responses)", the form the committee
 * filled in between 15 and 25 September 2026, where every one of them said
 * yes to "show this info on the CESAC website". Tidied in three ways and no
 * others: whitespace, social links cut down to the profile address without
 * tracking parameters, and Drive share links cut down to the file. A Drive
 * folder, or a LinkedIn page given as a photo, is not a photo and is left
 * out. Phone numbers and email addresses were collected by the form and are
 * deliberately not here: the roster is public and neither belongs on it.
 *
 * **This is the fallback, not the source.** The same answers were seeded into
 * `public.roster_people` by 20260925_profiles_photos_owner.sql, where the
 * committee edits them from the console; `getRoster()` reads the database and
 * only falls back to this when it cannot. Keyed by the roster's own spelling
 * of the name, which is how the seed matched them too.
 */

export type RosterProfile = {
  preferredName: string | null;
  yearBranch: string | null;
  tagline: string | null;
  about: string | null;
  hobbies: string | null;
  funFact: string | null;
  /** A Drive share link, as given. lib/photos.ts turns it into an image. */
  photoUrl: string | null;
  instagram: string | null;
  linkedin: string | null;
  github: string | null;
  tenure: string | null;
  /** The long form, for faculty: see FacultyDetails. Nobody else has one. */
  details?: FacultyDetails | null;
};

/**
 * A faculty member's profile, transcribed from the Institute's own faculty
 * pages rather than written by us, into roster_people.details.
 *
 * Every list can be empty and every string can be null: the page prints the
 * sections that have something in them and leaves out the rest, so a thin
 * source makes a short page, never an invented one.
 */
export type FacultyDetails = {
  full_name?: string | null;
  designation?: string | null;
  department?: string | null;
  institute?: string | null;
  email?: string | null;
  /** The page it was transcribed from. */
  source?: string | null;
  joined?: string | null;
  experience?: string | null;
  links?: { label: string; url: string }[];
  qualifications?: { degree: string; from: string | null; year: string | null }[];
  career?: { org: string; role: string | null; from: string | null; to: string | null }[];
  responsibilities?: string[];
  publications?: { type: string; items: { title: string; venue?: string | null; year?: string | null }[] }[];
  patents?: string[];
  projects?: string[];
  training?: {
    name: string;
    note: string | null;
    type: string;
    role: string;
    from: string | null;
    to: string | null;
  }[];
};

export const EMPTY_PROFILE: RosterProfile = {
  preferredName: null,
  yearBranch: null,
  tagline: null,
  about: null,
  hobbies: null,
  funFact: null,
  photoUrl: null,
  instagram: null,
  linkedin: null,
  github: null,
  tenure: null,
};

export const ROSTER_PROFILES: Readonly<Record<string, RosterProfile>> = {
  "Rutuja Hadke": {
    preferredName: null,
    yearBranch: "SY, Computer Engineering",
    tagline: "“A curious mind, a creative soul, and always up for something new.” 🌙",
    about: "I am into media and content.. I am good at cinematics and quite good edits.\nMind be not good at word but good in edited videos",
    hobbies: "Photography, cinematography, travelling",
    funFact: null,
    photoUrl: null,
    instagram: "https://www.instagram.com/its_ruttzz_/",
    linkedin: "https://www.linkedin.com/in/rutuja-hadke-902721385",
    github: null,
    tenure: null,
  },
  "Vedant Chavhan": {
    preferredName: null,
    yearBranch: "SY, Computer Engineering",
    tagline: "Tech innovator, esports lead, and proactive project manager bridging code, athletic focus, and community.",
    about: "I work in event and coordination at CESAC, will be bringing ideas to life by overseeing end-to-end logistics and team workflows. I’m passionate about building memorable, seamless events that bring people together effectively. In my free time, I enjoy creative design, organizing gatherings, and keeping up with live production tech.",
    hobbies: "Sports, adventure.",
    funFact: null,
    photoUrl: "https://drive.google.com/file/d/1mDSvxzXTOERTE4i-Xj-n2tNna2o5hjVG/view",
    instagram: "https://www.instagram.com/vedantchavan_02/",
    linkedin: "https://www.linkedin.com/in/vedant-chavan-a3855b373",
    github: null,
    tenure: null,
  },
  "Prathmesh Mante": {
    preferredName: "Pratham",
    yearBranch: "SY, Computer Engineering",
    tagline: "Turning ideas into things worth talking about.",
    about: "I’m someone who enjoys turning ideas into real projects, whether it’s building something, planning an event, or figuring out how to make an idea better. At CESAC, I love being involved in the creative and technical side of things and working with people who are just as driven to build and experiment. Always curious, always learning, and usually working on something new.",
    hobbies: "Technology, AI, building projects, hackathons, film making, music, exploring new ideas.",
    funFact: "I can turn a random idea at 2 AM into a full-blown project by morning.",
    photoUrl: "https://drive.google.com/file/d/12ej4KaZgg51vtHT9-jzI_4_bfTkzSr8b/view",
    instagram: "https://www.instagram.com/prathmesh_mante/",
    linkedin: "https://www.linkedin.com/in/prathmesh-mante-989aa7384",
    github: "https://github.com/prathmeshmante-glitch",
    tenure: null,
  },
  "Kadambari Dhaygude": {
    preferredName: null,
    yearBranch: "TY, Computer Engineering",
    tagline: null,
    about: null,
    hobbies: "Singing",
    funFact: null,
    photoUrl: null,
    instagram: null,
    linkedin: null,
    github: null,
    tenure: null,
  },
  "Shreya Kiran Kothawade": {
    preferredName: null,
    yearBranch: "SY, Computer Engineering",
    tagline: "Always learning. Always building. Never Settling.",
    about: "I’m a part of the Technical Team at CESAC, where I work on exploring technology and building innovative projects. I’m particularly interested in AI, software development, and learning new technologies by turning ideas into practical solutions. Still learning. Still building. Never settling.",
    hobbies: null,
    funFact: "I like turning thoughts and feelings into poetry—sometimes a simple moment is enough to inspire a few lines.",
    photoUrl: null,
    instagram: null,
    linkedin: null,
    github: null,
    tenure: null,
  },
  "Suhani Avinash Gawade": {
    preferredName: null,
    yearBranch: "TY, Computer Engineering",
    tagline: null,
    about: null,
    hobbies: "Travelling, Crafting",
    funFact: null,
    photoUrl: null,
    instagram: null,
    linkedin: null,
    github: null,
    tenure: null,
  },
  "Aditya Kale": {
    preferredName: null,
    yearBranch: "SY, Computer Engineering",
    tagline: "Somewhere between sorted and spontaneous",
    about: "I work behind the scenes at CESAC, where plans, people, and last-minute changes somehow have to come together. I enjoy the process of taking an idea and giving it a shape, a space, and a little personality. I’m drawn to things that look simple on the outside but have a lot going on behind them.",
    hobbies: "Curiosity, reading, writing, poetry, music, visual aesthetics, creative ideas, spontaneous plans, photography",
    funFact: "I notice what’s missing between good and great.",
    photoUrl: null,
    instagram: "https://www.instagram.com/adityakale__7/",
    linkedin: "https://www.linkedin.com/in/aditya-kale-6aa978314",
    github: "https://github.com/Aditya-Kale018",
    tenure: null,
  },
  "Chaitanya Yemul": {
    preferredName: null,
    yearBranch: "SY, Computer Engineering",
    tagline: "Curious Beyond Measure",
    about: "Technical Team Member at CESAC, focused on Backend Development.\nWorking with Python and FastAPI for backend development.",
    hobbies: "Anime, Listening Songs, Travelling",
    funFact: "Anime addict with an unhealthy curiosity for discovering new AI tools.",
    photoUrl: "https://drive.google.com/file/d/1uFOIgAiCalTrzJqk3Igb__o2rzD9itO5/view",
    instagram: "https://www.instagram.com/chaitanya_yemul/",
    linkedin: "https://www.linkedin.com/in/chaitanya-yemul-831b15330",
    github: "https://github.com/ChaitanyaYemul",
    tenure: null,
  },
  "Harsh Manjramkar": {
    preferredName: null,
    yearBranch: "TY, Computer Engineering",
    tagline: "Thinking deeper. Leading stronger. Winning together",
    about: "I work as the tech lead at CESAC. My main interests are to critically analyse problems or projects such that no flaws or limitations occur while or after execution, i am also into system design and believe in designing systems using own thoughts before distributing the work to ai",
    hobbies: "Badminton, Table tennis, anime",
    funFact: null,
    photoUrl: null,
    instagram: "https://www.instagram.com/harsh_manjramkar/",
    linkedin: null,
    github: null,
    tenure: null,
  },
  "Ansh Singh Gurdatta": {
    preferredName: null,
    yearBranch: "SY, Computer Engineering",
    tagline: "Building, learning and turning ideas into impact",
    about: "I’m part of the Events and Coordination team at CESAC, where I help plan, organize, and execute engaging events. I enjoy working with people, coordinating teams, and making sure things run smoothly from planning to execution.",
    hobbies: "Dancing, playing sports and travelling",
    funFact: null,
    photoUrl: null,
    instagram: "https://www.instagram.com/ansh_gurdatta/",
    linkedin: "https://www.linkedin.com/in/ansh-singh-gurdatta-161681379",
    github: "https://github.com/Ansh-Singh-Gurdatta",
    tenure: null,
  },
  "Manthan Mahesh Devi": {
    preferredName: "Manthan Devi",
    yearBranch: "SY, Computer Engineering",
    tagline: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
    about: "Second-year computer engineering undergrad contributing to technical initiatives and events at CESAC. I’m deep into data structures, algorithms, and exploring machine learning and neural networks, with an eye toward fintech down the line. Outside the terminal, you’ll find me training taekwondo on the mats or playing guitar.",
    hobbies: "DSA, Chess, badminton, taekwondo 🥋, guitar, reading.",
    funFact: "I am a world class taekwondo player who recently represented India in world taekwondo olympics at South Korea and won 1 gold and 3 silver on the international stage✨",
    photoUrl: null,
    instagram: "https://www.instagram.com/devimanthan/",
    linkedin: "https://www.linkedin.com/in/manthan-devi-8764a3386",
    github: "https://github.com/coder-manthan-007",
    tenure: null,
  },
  "Aditi Parmeshwar Shingare": {
    preferredName: null,
    yearBranch: "SY, Computer Engineering",
    tagline: "Believing me blindly",
    about: "A core team member involved in interacting and coordinating between fellow members. Involved in planning and conduction of all our events. Handles the people's side of the committee.",
    hobbies: "Learning new Technologies, Debating, Public Speaking, Interacting with new people",
    funFact: "I do Sing",
    photoUrl: "https://drive.google.com/file/d/1PRlWDJTd0jCl8EyepHdnkAIkLj_gMnlq/view",
    instagram: "https://www.instagram.com/jiyaaa_1951/",
    linkedin: "https://www.linkedin.com/in/aditi-shingare-726820385",
    github: "https://github.com/aditi1251070842-ui",
    tenure: null,
  },
  "Shruti Vishwanath Chandolkar": {
    preferredName: null,
    yearBranch: "SY, Computer Science",
    tagline: "Taking responsibility seriously, but never taking life too seriously.",
    about: "I’m a Computer Science Engineering student who loves learning new things and trying new experiences. I’m responsible when it comes to work, but I also believe that a little fun makes everything better. I’m looking forward to learning, contributing, and meeting new people through CESAC.",
    hobbies: "Music, dancing, badminton, travelling, technology, learning new things",
    funFact: "I may take time to open up, but once I’m comfortable, I can turn into the most talkative and fun person in the room!",
    photoUrl: null,
    instagram: "https://www.instagram.com/__shruti_2008__/",
    linkedin: "https://www.linkedin.com/in/shruti-chandolkar-32b6bb3ba",
    github: null,
    tenure: null,
  },
  "Rajvardhan Patil": {
    preferredName: null,
    yearBranch: "SY, Computer Engineering",
    tagline: "Curiosity is my starting point. Creation is my answer.",
    about: "I’m part of the Media domain at CESAC, where I contribute to shaping how the association communicates and connects with students. I enjoy turning ideas into engaging content and finding creative ways to make information stand out. I’m always keen to experiment, take on new challenges, and bring a fresh perspective to the team.",
    hobbies: "Sketching, video editing, hiking, fitness, playing guitar and flute, exploring technology, creative problem-solving, and building practical solutions.",
    funFact: "I can get ridiculously invested in an idea at 2 AM and somehow turn it into a project by morning.",
    photoUrl: null,
    instagram: "https://www.instagram.com/https.rajvardhan/",
    linkedin: "https://www.linkedin.com/in/rajvardhan-patil-b354423a8",
    github: "https://github.com/RajvardhanS-Patil",
    tenure: null,
  },
  "Nandita Kharade": {
    preferredName: null,
    yearBranch: "TY, Computer Engineering",
    tagline: "Making connections, creating opportunities.",
    about: "As CESAC’s Industry & Outreach Lead, I build meaningful connections, explore opportunities, and turn conversations into collaborations",
    hobbies: null,
    funFact: null,
    photoUrl: "https://drive.google.com/file/d/1FDAVFnaTwRya7_5TVx8yho1vpuhH4zMK/view",
    instagram: "https://www.instagram.com/nandita_1415/",
    linkedin: "https://www.linkedin.com/in/nandita-kharade-395084332",
    github: null,
    tenure: null,
  },
  "Roshani Khankure": {
    preferredName: null,
    yearBranch: "TY, Computer Engineering",
    tagline: "Quietly ambitious, casually chaotic. 😌",
    about: "I bring out ideas and event management tips to the team. Currently looking forward as a POC for alumni connect to the students looking for companies, startups, entrepreneurs, etc. I joined CESAC so that the dream of getting placed expands to a dream of a happy career.",
    hobbies: "Writing, Organizing, Dance.",
    funFact: "Making last-minute plans somehow work.",
    photoUrl: "https://drive.google.com/file/d/1KFfb8oV5v59PgvppX39Q2LV6WJmUdCW3/view",
    instagram: "https://www.instagram.com/rosh.1149/",
    linkedin: null,
    github: "https://github.com/rosh1149",
    tenure: null,
  },
  "Pranav Sable": {
    preferredName: null,
    yearBranch: "TY, Computer Engineering",
    tagline: "I do whatever makes sense to me",
    about: "The lead of media and content. I handle the socials of CESAC.",
    hobbies: "Sketching, gaming, cooking, coding, editing, travelling",
    funFact: "I can crochet",
    photoUrl: "https://drive.google.com/file/d/1lfDbOgt2GMGZVR7r8WTXKJ0_dU4P1QHC/view",
    instagram: "https://www.instagram.com/pranavss730/",
    linkedin: "https://www.linkedin.com/in/pranavss73",
    github: "https://github.com/pranavss73",
    tenure: null,
  },
  "Ayush Khatal": {
    preferredName: null,
    yearBranch: "TY, Computer Engineering",
    tagline: "Thoda overthink, phir overdeliver.",
    about: "I’m on the CESAC Board of Executives, helping handle everything from planning and executing events to making sure the team stays on track. I’m into tech, creative ideas, and turning ambitious plans into things that actually happen.",
    hobbies: "Badminton, Piano, Cricket, Music, Chilling with friends",
    funFact: null,
    photoUrl: null,
    instagram: "https://www.instagram.com/ayush.k_136/",
    linkedin: "https://www.linkedin.com/in/ayushkhatal",
    github: "https://github.com/Ayush136-devops",
    tenure: null,
  },
  "Shraddha Khetmalis": {
    preferredName: null,
    yearBranch: "TY, Computer Engineering",
    tagline: "Making connections, chasing opportunities, and collecting a little tea along the way.",
    about: "I’m part of CESAC’s Industry & Outreach team, where I focus on identifying potential industry partners, reaching out to companies and professionals, and building collaborations for CESAC’s events and initiatives. I enjoy networking, communicating with new people, and finding opportunities that can create value for both the committee and our partners",
    hobbies: "Books, paint & journals, harmonica, cooking, cinema, travel, food, makeup & tech",
    funFact: "I’m always ready for some tea and probably have some gyaan to add to it.🦖",
    photoUrl: "https://drive.google.com/file/d/1C2AFkPirleRtyzSf623ZFNlW7-lFRFWq/view",
    instagram: "https://www.instagram.com/shraddha__0_9/",
    linkedin: "https://www.linkedin.com/in/shraddha-khetmalis-75b05b410",
    github: "https://github.com/shraddhaa09",
    tenure: null,
  },
  "Kanak Agrawal": {
    preferredName: null,
    yearBranch: "TY, Computer Engineering",
    tagline: "Think beyond. Build forward.",
    about: "I’m Kanak, a Core Member at CESAC, where I help plan and execute initiatives for the Computer Engineering community. I enjoy working with people to turn ideas into action.",
    hobbies: "Trekking, Painting, Reading",
    funFact: "I get way too excited whenever a new idea pops into my head.",
    photoUrl: null,
    instagram: "https://shorturl.at/fnDCx",
    linkedin: "https://shorturl.at/mo5md",
    github: "https://github.com/Kanak-Agrawal-3008",
    tenure: null,
  },
  "Harshada Bhapkar": {
    preferredName: "Harsha",
    yearBranch: "TY, Computer Engineering",
    tagline: null,
    about: null,
    hobbies: null,
    funFact: null,
    photoUrl: null,
    instagram: null,
    linkedin: null,
    github: null,
    tenure: null,
  },
  "Aditya Krushna Chavan": {
    preferredName: null,
    yearBranch: "SY, Computer Engineering",
    tagline: "Too distracted too distract",
    about: "Do suggest ideas, makes things work out and execute the task ( sach bolu to sirf mauj masti)",
    hobbies: "Take a nap which last longs in hours",
    funFact: "I can touch my nose with my tongue",
    photoUrl: "https://drive.google.com/file/d/15tAjm9yfhrpr0teAmHtdUvdg035DLJX3/view",
    instagram: "https://www.instagram.com/aditya_chavan_0704/",
    linkedin: "https://www.linkedin.com/in/adityachavan0704",
    github: "https://github.com/adityachavan0704-web",
    tenure: null,
  },
  "Vedant Gaidhani": {
    preferredName: null,
    yearBranch: "TY, Computer Engineering",
    tagline: "Code, creativity, and a little bit of chaos",
    about: "Tech Lead at CESAC who loves building things that push the boundaries of technology and creativity. I work with AI, web development, and emerging tech. At CESAC, I focus on the technical side while helping the team experiment, build, and bring ambitious ideas to life.",
    hobbies: "Sports, AI, Hackathons, Web Development, 3D & Creative Tech",
    funFact: null,
    photoUrl: null,
    instagram: null,
    linkedin: null,
    github: null,
    tenure: null,
  },
  "Jasleen Kaur Multani": {
    preferredName: null,
    yearBranch: "TY, Computer Engineering",
    tagline: "Turning technical possibilities into practical outcomes.",
    about: "As the Technical Lead at CESAC, I work on driving the technical direction of the club and turning ideas into practical, impactful projects. I’m particularly interested in emerging technologies, AI/ML, software development, and building solutions that combine innovation with real-world applications.",
    hobbies: "Hand made crafts",
    funFact: "I play harmonium",
    photoUrl: null,
    instagram: "https://www.instagram.com/jasleeeen.kaur_/",
    linkedin: "https://www.linkedin.com/in/jasleen-multani-74a9b0333",
    github: "https://github.com/jasleenk8999",
    tenure: null,
  },
  "Viral Dhoka": {
    preferredName: "Viral/Viralala",
    yearBranch: "SY, Computer Engineering",
    tagline: "Death is the fear",
    about: "I am Viral Dhoka, Core member of CESAC and studying in VIT right now. I am the creator of this website",
    hobbies: "WebDev, Valorant, Every sport",
    funFact: "I love competition and I am a professional Valorant Player",
    photoUrl: null,
    instagram: "https://www.instagram.com/viraldrafts/",
    linkedin: "https://www.linkedin.com/in/viral-dhoka-1aa3b4318",
    github: "https://github.com/viralala",
    tenure: null,
  },
};

/**
 * A name as the tail of a /people address. The same rule as
 * `public.roster_slugify()`, so a page reached from the fallback roster and
 * one reached from the database are at the same address.
 */
export function rosterSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
