const fs = require('fs');
const path = require('path');

// Read the JSON file
const jsonPath = path.join(__dirname, 'vibe-coding-lesson-contents.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Prepare the batch create request
const batchCreateRequest = {
  jsonrpc: "2.0",
  method: "tools/call",
  params: {
    name: "bitable.v1.appTableRecord.batchCreate",
    arguments: {
      data: {
        app_token: "Pvo3bR2b8aeh14sqVppjAXR4pkN",
        table_id: "tblqsLcjOdNTHLwz",
        records: data.records
      }
    }
  },
  id: 1
};

// Output the request JSON
console.log(JSON.stringify(batchCreateRequest, null, 2));