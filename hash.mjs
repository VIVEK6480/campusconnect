import bcrypt from "bcryptjs";

async function generate() {
  try {
    console.log("Generating hash...");
    const hash = await bcrypt.hash("admin123", 10);
    console.log("Hash:", hash);
  } catch (err) {
    console.error(err);
  }
}

generate();