import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type DictEntry = string | { meaning?: string; definition?: string; pronunciation?: string; pos?: string };
let dictionaryCache: Record<string, DictEntry> | null = null;

function loadDictionary(): Record<string, DictEntry> {
  if (dictionaryCache) {
    return dictionaryCache;
  }

  try {
    const filePath = path.join(process.cwd(), "dictionary", "dictionary_compact.json");
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      dictionaryCache = JSON.parse(fileContent);
    } else {
      console.warn("Dictionary file not found at:", filePath);
      dictionaryCache = {};
    }
  } catch (error) {
    console.error("Failed to load dictionary JSON:", error);
    dictionaryCache = {};
  }

  return dictionaryCache || {};
}

function extractConciseMeaning(raw: DictEntry): { meaning: string; pronunciation?: string } {
  if (typeof raw === "object" && raw !== null) {
    return {
      meaning: (raw.meaning || raw.definition || "").trim(),
      pronunciation: raw.pronunciation?.trim(),
    };
  }

  let text = (raw || "").trim();

  // Strip initial "1. " if present
  text = text.replace(/^1\.\s*/, "");

  // Cut off second definitions (e.g. "\n\n", " 2. ", "\n2. ")
  const secondDefIdx = text.search(/(\n|\r|\s2\.\s)/);
  if (secondDefIdx > 0) {
    text = text.slice(0, secondDefIdx).trim();
  }

  // Remove "Syn. -- ..." and "Note: ..."
  text = text.replace(/\s*(Syn\.|Note:)[\s\S]*/i, "").trim();


  // Remove quotes in quotes like `"..."`
  text = text.replace(/"[^"]*"/g, "").trim();

  // Remove trailing author citations, e.g. "Shak.", "Chaucer.", "Dryden.", "Milton.", "Bacon.", "Cowper."
  text = text.replace(/\b(Shak|Chaucer|Dryden|Milton|Bacon|Cowper|Pope|Addison|Spenser|Longfellow|Tennyson|Swift|Johnson|Burke|Goldsmith)\.?\s*$/i, "").trim();

  // Keep first complete sentence if long
  const sentenceMatch = text.match(/^([^.!?]+[.!?])/);
  if (sentenceMatch && sentenceMatch[1] && sentenceMatch[1].length > 15) {
    text = sentenceMatch[1].trim();
  }

  // Final length guard
  if (text.length > 220) {
    text = text.slice(0, 217).trim() + "...";
  }

  return { meaning: text };
}

function findDefinition(word: string, dict: Record<string, DictEntry>): { meaning: string; pronunciation?: string } | null {
  const clean = word.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!clean) return null;

  // Direct match
  if (dict[clean]) return extractConciseMeaning(dict[clean]);

  // Variations & Lemmatization attempts
  // 1. Plural / Suffix -s / -es
  if (clean.endsWith("ies") && clean.length > 3) {
    const candidate = clean.slice(0, -3) + "y";
    if (dict[candidate]) return extractConciseMeaning(dict[candidate]);
  }
  if (clean.endsWith("es") && clean.length > 3) {
    const candidate = clean.slice(0, -2);
    if (dict[candidate]) return extractConciseMeaning(dict[candidate]);
  }
  if (clean.endsWith("s") && clean.length > 2) {
    const candidate = clean.slice(0, -1);
    if (dict[candidate]) return extractConciseMeaning(dict[candidate]);
  }

  // 2. Past tense -ed / -d
  if (clean.endsWith("ed") && clean.length > 3) {
    const candidate1 = clean.slice(0, -2);
    if (dict[candidate1]) return extractConciseMeaning(dict[candidate1]);
    const candidate2 = clean.slice(0, -1);
    if (dict[candidate2]) return extractConciseMeaning(dict[candidate2]);
  }

  // 3. Continuous -ing
  if (clean.endsWith("ing") && clean.length > 4) {
    const candidate1 = clean.slice(0, -3);
    if (dict[candidate1]) return extractConciseMeaning(dict[candidate1]);
    const candidate2 = clean.slice(0, -3) + "e";
    if (dict[candidate2]) return extractConciseMeaning(dict[candidate2]);
  }

  // 4. Adverb -ly
  if (clean.endsWith("ly") && clean.length > 3) {
    const candidate = clean.slice(0, -2);
    if (dict[candidate]) return extractConciseMeaning(dict[candidate]);
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawWord = searchParams.get("word");

    if (!rawWord || typeof rawWord !== "string") {
      return NextResponse.json(
        { message: "Word parameter is required" },
        { status: 400 },
      );
    }

    const dict = loadDictionary();
    const cleanWord = rawWord.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    const result = findDefinition(cleanWord, dict);

    if (result && result.meaning) {
      return NextResponse.json({
        word: cleanWord,
        meaning: result.meaning,
        definition: result.meaning,
        pronunciation: result.pronunciation,
        found: true,
      });
    }

    return NextResponse.json({
      word: cleanWord,
      meaning: `No direct definition found for "${cleanWord}".`,
      definition: `No direct definition found for "${cleanWord}".`,
      found: false,
    });
  } catch (error) {
    console.error("DICTIONARY API ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
