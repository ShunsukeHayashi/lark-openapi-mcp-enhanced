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

// Define the categories you want
const CATEGORIES = [
  { name: 'Camera Equipment - Professional Tripods', color: 0 },
  { name: 'Camera Equipment - Travel/Compact Tripods', color: 1 },
  { name: 'Camera Equipment - Tabletop Tripods', color: 2 },
  { name: 'Camera Equipment - Premium Tripods', color: 3 },
  { name: 'Camera Equipment - Video Tripods', color: 4 },
  { name: 'Camera Equipment - Standard Tripods', color: 5 },
  { name: 'Camera Equipment - Budget Tripods', color: 6 },
  { name: 'Camera Equipment - Smartphone Tripods', color: 7 },
  { name: 'Template - Not for Sale', color: 8 }
];

async function createNewCategoryField() {
  try {
    console.log('Creating new Product Category field...');
    
    const response = await client.bitable.appTableField.create({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID,
      },
      data: {
        field_name: 'Product Category',
        type: 3, // 3 is for single select
        property: {
          options: CATEGORIES
        }
      }
    });

    if (response.code === 0 && response.data?.field) {
      console.log(`✅ Successfully created new category field: ${response.data.field.field_name} (ID: ${response.data.field.field_id})`);
      return response.data.field;
    } else {
      console.error('Failed to create field:', response);
      return null;
    }
  } catch (error) {
    console.error('Error creating category field:', error);
    return null;
  }
}

async function populateCategoryField(fieldId: string) {
  console.log('\nNow populating the new field with appropriate categories...');
  console.log('Fetching all records...');
  
  try {
    // Get all records
    const recordsResponse = await client.bitable.appTableRecord.search({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID,
      },
      params: {
        page_size: 500,
      }
    });

    if (!recordsResponse.data?.items) {
      console.log('No records found');
      return;
    }

    const records = recordsResponse.data.items;
    console.log(`Found ${records.length} records`);

    // Update each record with category based on product name
    let successCount = 0;
    let errorCount = 0;

    for (const record of records) {
      try {
        // Extract product name
        let productName = '';
        const nameField = record.fields['📝商品名'];
        if (Array.isArray(nameField) && nameField.length > 0 && typeof nameField[0] === 'object' && 'text' in nameField[0]) {
          productName = String(nameField[0].text || '');
        } else if (typeof nameField === 'string') {
          productName = nameField;
        }

        // Determine category based on product name and characteristics
        let category = 'Camera Equipment - Standard Tripods';
        
        if (/template|テンプレート/i.test(productName)) {
          category = 'Template - Not for Sale';
        }
        else if (/professional|プロフェッショナル|プロ/i.test(productName)) {
          category = 'Camera Equipment - Professional Tripods';
        }
        else if (/travel|トラベル|compact|コンパクト|軽量/i.test(productName)) {
          category = 'Camera Equipment - Travel/Compact Tripods';
        }
        else if (/tabletop|卓上|desk|デスク|mini|ミニ/i.test(productName)) {
          category = 'Camera Equipment - Tabletop Tripods';
        }
        else if (/video|ビデオ|動画/i.test(productName)) {
          category = 'Camera Equipment - Video Tripods';
        }
        else if (/smartphone|スマートフォン|スマホ|phone/i.test(productName)) {
          category = 'Camera Equipment - Smartphone Tripods';
        }
        else if (/premium|プレミアム|高級/i.test(productName)) {
          category = 'Camera Equipment - Premium Tripods';
        }
        else if (/budget|バジェット|格安/i.test(productName)) {
          category = 'Camera Equipment - Budget Tripods';
        }
        else {
          // Use price to determine if it's premium or budget
          const unitPriceField = record.fields['💰単価'];
          const unitPrice = typeof unitPriceField === 'number' ? unitPriceField : 0;
          if (unitPrice >= 10000) {
            category = 'Camera Equipment - Premium Tripods';
          } else if (unitPrice < 5000) {
            category = 'Camera Equipment - Budget Tripods';
          }
        }

        // Update the record
        await client.bitable.appTableRecord.update({
          path: {
            app_token: APP_TOKEN,
            table_id: TABLE_ID,
            record_id: record.record_id || '',
          },
          data: {
            fields: {
              [fieldId]: category
            }
          }
        });

        successCount++;
        console.log(`✓ Updated record ${record.record_id}: ${productName} -> ${category}`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to update record ${record.record_id}:`, error);
      }
    }

    console.log(`\n✅ Population completed! Success: ${successCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error('Error populating records:', error);
  }
}

async function main() {
  try {
    console.log('Starting new category field creation process...');
    console.log(`App Token: ${APP_TOKEN}`);
    console.log(`Table ID: ${TABLE_ID}`);
    console.log('\nCategories to be created:');
    CATEGORIES.forEach(cat => console.log(`  - ${cat.name}`));
    
    // Create new field
    const newField = await createNewCategoryField();
    
    if (newField) {
      console.log('\n✅ Field created successfully!');
      
      // Ask if user wants to populate the field
      console.log('\nThe field has been created. You can now populate it with categories based on product names.');
      
      // Automatically populate the field
      await populateCategoryField(newField.field_id!);
    } else {
      console.error('❌ Failed to create category field');
    }
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
    process.exit(1);
  }
}

// Run the main function
main();