/**
 * The Computer Engineering department committee and the CESAC roster.
 *
 * Names, roles and vertical membership are transcribed verbatim from
 * "CESAC TEAM.xlsx". The one-line `remit` on each vertical is NOT from the
 * sheet: the sheet carries only the vertical name. Those lines are plain
 * readings of the title and nothing more, so keep them descriptive and replace
 * them the moment the committee supplies its own wording. Do not add
 * achievements, headcounts or history here that nobody has provided.
 *
 * Each vertical has three leads, transcribed into its `leads` list below; the
 * rest of its members are heads, and the roster labels them as such. The
 * Department Representative sits in `STUDENT_LEADERSHIP`, not `FACULTY`: on
 * the sheet the DR is a student representative to the department, boxed
 * separately from the HOD/Assistant HOD pairing, and the roster keeps that.
 */

export const DEPARTMENT = {
  name: "Computer Engineering",
  institute: "Vishwakarma Institute of Technology, Pune",
  body: "CESAC",
  expansion: "Computer Engineering Student Activities Committee",
  blurb:
    "CESAC is the student activities committee of the Computer Engineering department at VIT Pune. It sits under the department's faculty leadership and carries every event from planning to run of show.",
} as const;

export type Person = { name: string; role: string };

export const FACULTY: readonly Person[] = [
  { name: "Dr. Sandeep Shinde", role: "HOD, Computer Engineering" },
  { name: "Dr. Aarti Agarkar", role: "Assistant HOD, Computer Engineering" },
  { name: "Dr. Geeta Navale", role: "Student Activity Co-Ordinator" },
];

/** Student representation to the department, kept apart from faculty. */
export const STUDENT_LEADERSHIP: readonly Person[] = [
  { name: "Yeshwant Kendre", role: "Department Representative" },
];

/** Labelled "Board of Executives" on the committee sheet. */
export const BOARD: readonly string[] = [
  "Aditya Raj Tripathi",
  "Ayush Khatal",
  "Samarth Khedkar",
  "Om Kharate",
  "Manas Kenjale",
  "Kanak Agrawal",
  "Roshani Khankure",
];

/** Labelled "Associate Executives" on the committee sheet. */
export const ASSOCIATES: readonly string[] = ["Viral Dhoka", "Aditi Parmeshwar Shingare"];

export type Vertical = {
  id: string;
  index: string;
  name: string;
  jp: string;
  remit: string;
  members: readonly string[];
  /** This vertical's leads. Every other name in `members` is a head. */
  leads: readonly string[];
};

export const VERTICALS: readonly Vertical[] = [
  {
    id: "technical",
    index: "01",
    name: "Technical",
    jp: "技術",
    remit: "Platforms, tooling and anything the events run on.",
    members: [
      "Harsh Manjramkar",
      "Vedant Gaidhani",
      "Jasleen Kaur Multani",
      "Chaitanya Yemul",
      "Manthan Mahesh Devi",
      "Shreya Kiran Kothawade",
      "Aditya Krushna Chavan",
    ],
    leads: ["Harsh Manjramkar", "Vedant Gaidhani", "Jasleen Kaur Multani"],
  },
  {
    id: "media",
    index: "02",
    name: "Media and Content",
    jp: "広報",
    remit: "Key art, copy, capture and the recap.",
    members: [
      "Pranav Sable",
      "Harshada Bhapkar",
      "Kadambari Dhaygude",
      "Rajvardhan Patil",
      "Vishwajeet Gaikwad",
      "Rutuja Hadke",
    ],
    leads: ["Pranav Sable", "Harshada Bhapkar", "Kadambari Dhaygude"],
  },
  {
    id: "events",
    index: "03",
    name: "Event and Coordination",
    jp: "運営",
    remit: "Run of show, venue, volunteers and logistics.",
    members: [
      "Anvay Bahadur",
      "Suhani Avinash Gawade",
      "Om Chavhan",
      "Aditya Kale",
      "Vedant Chavhan",
      "Shruti Vishwanath Chandolkar",
      "Ansh Singh Gurdatta",
    ],
    leads: ["Anvay Bahadur", "Suhani Avinash Gawade", "Om Chavhan"],
  },
  {
    id: "outreach",
    index: "04",
    name: "Industry and Outreach",
    jp: "渉外",
    remit: "Sponsors, partners, judges and mentors.",
    members: [
      "Aarhan Goswami",
      "Shraddha Khetmalis",
      "Nandita Kharade",
      "Bhoomi Baghele",
      "Prathmesh Mante",
      "Jayesh Vishwakarma",
    ],
    leads: ["Aarhan Goswami", "Shraddha Khetmalis", "Nandita Kharade"],
  },
];

export const TEAM_TOTAL =
  FACULTY.length +
  STUDENT_LEADERSHIP.length +
  BOARD.length +
  ASSOCIATES.length +
  VERTICALS.reduce((n, v) => n + v.members.length, 0);
