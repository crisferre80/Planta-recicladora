const fetch = require('node-fetch');
const url = 'https://ylkvmiqyhhtxyuwtargi.supabase.co/rest/v1/production_records?select=id,materialTypeId,quantity,date,operatorId,equipmentId&limit=50';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsa3ZtaXF5aGh0eHl1d3RhcmdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTk5NTAsImV4cCI6MjA5MjM3NTk1MH0.UM8UzKED8A39rpOsUM-n5Wo1XR_To920bydO5W6c0Bg';
(async () => {
  try {
    const res = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json'
      }
    });
    console.log('status', res.status);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
})();
