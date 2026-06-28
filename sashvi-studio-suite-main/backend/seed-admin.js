const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcrypt");
require("dotenv").config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in backend/.env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  const email = "admin@sashvistudio.com";
  const password = "sashviadmin6000";
  const hash = await bcrypt.hash(password, 12);

  // Check if user exists
  const { data: existing, error: fetchError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (fetchError) {
    console.error("Error fetching user:", fetchError);
    process.exit(1);
  }

  if (existing) {
    // Update
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password: hash,
        role: "admin",
        name: "Admin"
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("Error updating admin user:", updateError);
      process.exit(1);
    }
    console.log("Admin user updated successfully in Supabase!");
  } else {
    // Insert
    const { error: insertError } = await supabase
      .from("users")
      .insert({
        name: "Admin",
        email,
        password: hash,
        mobile: "0000000000",
        role: "admin"
      });

    if (insertError) {
      console.error("Error inserting admin user:", insertError);
      process.exit(1);
    }
    console.log("Admin user created successfully in Supabase!");
  }
}

run();
