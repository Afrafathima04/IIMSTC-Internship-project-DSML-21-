import Papa from "papaparse";

export async function loadCSVData() {
  try {
    const response = await fetch("/data/feedback.csv"); // ✅ correct path

    if (!response.ok) {
      throw new Error("Failed to fetch CSV");
    }

    const csvText = await response.text();

    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    console.log("CSV DATA:", result.data); // debug

    return result.data;
  } catch (error) {
    console.error("Error loading CSV:", error);
    return [];
  }
}