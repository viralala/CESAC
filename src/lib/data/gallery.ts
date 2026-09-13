import type { GalleryItem } from "./types";

export const GALLERY: GalleryItem[] = [
  { id: "g1", caption: "Clean-up teams sorting collected waste", eventLabel: "Community Clean-Up Drive", year: "2025", pattern: 0, isSample: true },
  { id: "g2", caption: "Orientation seminar, question and answer segment", eventLabel: "Volunteer Orientation Seminar", year: "2025", pattern: 1, isSample: true },
  { id: "g3", caption: "Workshop groups drafting sample proposals", eventLabel: "Foundations of Community Extension", year: "2025", pattern: 2, isSample: true },
  { id: "g4", caption: "Officers presenting committee reports", eventLabel: "CESAC General Assembly", year: "2025", pattern: 3, isSample: true },
  { id: "g5", caption: "Seedlings ready for planting at the watershed site", eventLabel: "Tree Planting Initiative", year: "2024", pattern: 0, isSample: true },
  { id: "g6", caption: "Volunteers and partner organizations at the close-out program", eventLabel: "Annual Recognition Night", year: "2024", pattern: 1, isSample: true },
  { id: "g7", caption: "Sorting bins set up along the campus path", eventLabel: "Community Clean-Up Drive", year: "2024", pattern: 2, isSample: true },
  { id: "g8", caption: "Committee heads walking through the term plan", eventLabel: "CESAC General Assembly", year: "2024", pattern: 3, isSample: true },
];

export function getAllGalleryItems() {
  return GALLERY;
}
