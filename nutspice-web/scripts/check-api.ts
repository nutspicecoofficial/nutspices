async function checkApi() {
  try {
    const res = await fetch("http://localhost:3000/api/products/1");
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e: any) {
    console.error("Failed to fetch API:", e.message);
  }
}

checkApi();
