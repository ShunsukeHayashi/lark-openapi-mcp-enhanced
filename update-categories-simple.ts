import * as lark from '@larksuiteoapi/node-sdk';

// Initialize Lark client
const client = new lark.Client({
  appId: 'cli_a8d2fdb1f1f8d02d',
  appSecret: 'V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ',
  domain: lark.Domain.Feishu
});

const APP_TOKEN = 'W66tbCpb7avIjSsGvBhjRxtZpHc';
const TABLE_ID = 'tblPSgtK8IBbw9pP';
const CATEGORY_FIELD_ID = 'fldWbgvINm';

async function updateCategories() {
  try {
    console.log('Starting category update...');
    
    // First, let's try to add options to the field
    console.log('\n1. Attempting to configure field options...');
    try {
      const fieldUpdateData = {
        field_name: '📦商品カテゴリ',
        type: 3,
        property: {
          options: [
            { name: '電子製品', color: 0 },
            { name: '書籍', color: 1 },
            { name: '衣料品', color: 2 },
            { name: '食品', color: 3 },
            { name: 'その他', color: 4 }
          ]
        }
      };
      
      const updateFieldResponse = await client.request({
        method: 'PUT',
        url: `/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/fields/${CATEGORY_FIELD_ID}`,
        data: fieldUpdateData
      });
      
      console.log('Field update response:', updateFieldResponse.data);
    } catch (fieldError) {
      console.log('Could not update field options. Proceeding with record updates...');
    }
    
    // Get all records
    console.log('\n2. Getting all records...');
    const recordsResponse = await client.bitable.appTableRecord.list({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID
      },
      params: {
        page_size: 500 // Get more records
      }
    });

    if (!recordsResponse.data?.items) {
      throw new Error('Failed to get records');
    }

    const records = recordsResponse.data.items;
    console.log(`Found ${records.length} records`);

    // Update each record
    console.log('\n3. Updating records with category...');
    let successCount = 0;
    let errorCount = 0;

    for (const record of records) {
      try {
        const productName = record.fields['📝商品名'] || '';
        
        // Since all products appear to be tripods/camera accessories, set them to Electronics
        const updateData = {
          fields: {
            [CATEGORY_FIELD_ID]: '電子製品'
          }
        };

        await client.bitable.appTableRecord.update({
          path: {
            app_token: APP_TOKEN,
            table_id: TABLE_ID,
            record_id: record.record_id || ''
          },
          data: updateData
        });
        
        successCount++;
        console.log(`✓ Updated ${record.record_id}: ${productName} -> 電子製品`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to update ${record.record_id}:`, error);
      }
    }

    console.log(`\n✅ Update completed! Success: ${successCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the update
updateCategories();