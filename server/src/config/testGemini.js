
require("dotenv").config();

console.log("1. Loading Gemini configuration...");

const ai = require("./gemini");

console.log("2. Gemini SDK loaded successfully!");

const testGemini = async () => {
  try {
    console.log("3. Sending request to Gemini...");

    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: "Reply with: HOA Gemini AI connection successful"
    });

    console.log("4. Gemini Response:");
    console.log(interaction.output_text);

  } catch (error) {
    console.error("Gemini Error:", error.message);
  }
};

testGemini();
