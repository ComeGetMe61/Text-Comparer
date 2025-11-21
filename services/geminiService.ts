
export const explainDifferences = async (original: string, modified: string): Promise<string> => {
  try {
    const response = await fetch('https://text-ai-diff.azurewebsites.net/api/explain-diff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalText: original,
        modifiedText: modified,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.explanation || "No explanation generated.";
  } catch (error) {
    console.error("AI Service Error:", error);
    return "Unable to generate explanation at this time. Please ensure the backend service is running and accessible.";
  }
};
