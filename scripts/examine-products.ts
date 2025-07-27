import { Client } from '@larksuiteoapi/node-sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Lark client
const client = new Client({
  appId: process.env.APP_ID!,
  appSecret: process.env.APP_SECRET!,
});

const APP_TOKEN = 'W66tbCpb7avIjSsGvBhjRxtZpHc';
const TABLE_ID = 'tblPSgtK8IBbw9pP';

async function fetchAndExamineProducts() {
  try {
    const response = await client.bitable.appTableRecord.search({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID,
      },
      params: {
        page_size: 5, // Just fetch a few products to examine
      },
    });
    
    if (response.data?.items && response.data.items.length > 0) {
      console.log(`Found ${response.data.items.length} products. Here are their details:\n`);
      
      response.data.items.forEach((item: any, index: number) => {
        console.log(`Product ${index + 1}:`);
        console.log(`Record ID: ${item.record_id}`);
        console.log('Fields:');
        console.log(JSON.stringify(item.fields, null, 2));
        console.log('---\n');
      });
      
      // Show all field names
      const allFieldNames = new Set<string>();
      response.data.items.forEach((item: any) => {
        Object.keys(item.fields).forEach(key => allFieldNames.add(key));
      });
      
      console.log('All field names found:');
      console.log(Array.from(allFieldNames).join(', '));
    } else {
      console.log('No products found.');
    }
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

fetchAndExamineProducts();