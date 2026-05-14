export interface SuggestResponse {
  categories?: { name: string; slug: string }[];
  tags?: { name: string; slug: string }[];
  [key: string]: { name: string; slug: string }[] | undefined;
}