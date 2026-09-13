/**
 * The Computer Engineering department committee and the CESAC roster,
 * transcribed from "CESAC TEAM.xlsx".
 */

export const DEPARTMENT = {
  name: "Computer Engineering",
  institute: "Vishwakarma Institute of Technology, Pune",
  body: "CESAC",
  expansion: "Computer Engineering Student Activities Committee",
  blurb:
    "Attack on Token is run by CESAC — the student activities committee of the Computer Engineering department at VIT Pune. The committee sits under the department's faculty leadership and carries every event from planning to run-of-show.",
} as const;

export type Person = { name: string; role: string };

export const FACULTY: readonly Person[] = [
  { name: "Dr. Sandeep Shinde", role: "HOD, Computer Engineering" },
  { name: "Dr. Aarti Agarkar", role: "Assistant HOD, Computer Engineering" },
  { name: "Yeshwant Kendre", role: "Department Representative" },
];

export const BOARD: readonly string[] = [
  "Aditya Raj Tripathi",
  "Ayush Khatal",
  "Samarth Khedkar",
  "Om Kharate",
  "Manas Kenjale",
  "Kanak Agrawal",
  "Roshani Khankure",
];

export const ASSOCIATES: readonly string[] = ["Viral Dhoka", "Aditi Parmeshwar Shingare"];

export type Vertical = {
  id: string;
  index: string;
  name: string;
  jp: string;
  remit: string;
  members: readonly string[];
};

export const VERTICALS: readonly Vertical[] = [
  {
    id: "technical",
    index: "01",
    name: "Technical",
    jp: "技術",
    remit: "Platform, grading pipeline, leaderboard and event-day tooling.",
    members: [
      "Harsh Manjramkar",
      "Vedant Gaidhani",
      "Jasleen Kaur Multani",
      "Chaitanya Yemul",
      "Manthan Mahesh Devi",
      "Shreya Kiran Kothawade",
      "Aditya Krushna Chavan",
    ],
  },
  {
    id: "media",
    index: "02",
    name: "Media and Content",
    jp: "広報",
    remit: "Key art, chapter visuals, copy, capture and the recap.",
    members: [
      "Pranav Sable",
      "Harshada Bhapkar",
      "Kadambari Harishchandra Dhaygude",
      "Rajvardhan Patil",
      "Vishwajeet Gaikwad (Resources)",
      "Rutuja Hadke",
    ],
  },
  {
    id: "events",
    index: "03",
    name: "Event and Coordination",
    jp: "運営",
    remit: "Run of show, venue, chit market, volunteers and logistics.",
    members: [
      "Anvay Bahadur",
      "Suhani Avinash Gawade",
      "Om Chavhan",
      "Aditya Kale",
      "Vedant Chavhan",
      "Shruti Vishwanath Chandolkar",
      "Ansh Singh Gurdatta",
    ],
  },
  {
    id: "outreach",
    index: "04",
    name: "Industry and Outreach",
    jp: "渉外",
    remit: "Sponsors, partners, judges, mentors and prize pool.",
    members: [
      "Aarhan Goswami",
      "Shraddha Khetmalis",
      "Nandita Kharade",
      "Bhoomi Baghele",
      "Prathmesh Mante",
      "Jayesh Vishwakarma",
    ],
  },
];

export const TEAM_TOTAL =
  FACULTY.length +
  BOARD.length +
  ASSOCIATES.length +
  VERTICALS.reduce((n, v) => n + v.members.length, 0);
