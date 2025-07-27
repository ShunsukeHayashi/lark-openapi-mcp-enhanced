import * as lark from '@larksuiteoapi/node-sdk';

// Initialize Lark client
const client = new lark.Client({
  appId: 'cli_a8d2fdb1f1f8d02d',
  appSecret: 'V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ',
  domain: lark.Domain.Feishu
});

const APP_TOKEN = 'W66tbCpb7avIjSsGvBhjRxtZpHc';
const TABLE_ID = 'tblPSgtK8IBbw9pP';

async function updateBitableCategories() {
  try {
    console.log('Starting Bitable category update...');

    // Step 1: Get table fields to find the category field
    console.log('\n1. Getting table fields...');
    const fieldsResponse = await client.bitable.appTableField.list({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID
      }
    });

    console.log('Fields response:', JSON.stringify(fieldsResponse, null, 2));

    if (!fieldsResponse.data?.items) {
      throw new Error('Failed to get table fields');
    }

    // Find the category field
    const categoryField = fieldsResponse.data.items.find(
      (field: any) => field.field_name === '📦商品カテゴリ' || field.field_name === 'Category' || field.field_name === '类别' || field.field_name === 'カテゴリー'
    );

    if (!categoryField) {
      throw new Error('Category field not found');
    }

    console.log(`\nFound category field: ${categoryField.field_name} (ID: ${categoryField.field_id}, Type: ${categoryField.type})`);

    // Step 2: Check if the field needs to be updated with selection options
    if (categoryField.type === 3 && categoryField.property?.options?.length === 0) {
      console.log('\n2. Updating category field with selection options...');
      
      const categoryOptions = [
        { name: '電子製品' },
        { name: '書籍' },
        { name: '衣料品' },
        { name: '食品' },
        { name: 'その他' }
      ];

      try {
        // Since the field is already a single select, we just need to add options
        const updateFieldResponse = await client.bitable.appTableField.update({
          path: {
            app_token: APP_TOKEN,
            table_id: TABLE_ID,
            field_id: categoryField.field_id || ''
          },
          data: {
            field_name: categoryField.field_name,
            type: 3, // Type 3 is for single select
            property: {
              options: categoryOptions
            }
          }
        });

        console.log('Field update response:', JSON.stringify(updateFieldResponse, null, 2));
      } catch (error) {
        console.log('Field update error - attempting to proceed with existing field configuration');
        console.error('Error details:', error);
      }
    } else if (categoryField.type !== 3) {
      console.log('\nCategory field is not a single select type. Current type:', categoryField.type);
      console.log('Please manually convert the field to single select type in Feishu/Lark.');
      return;
    } else {
      console.log('\nCategory field already has options configured. Skipping field update.');
    }

    // Step 3: Get all records to update their categories
    console.log('\n3. Getting all records...');
    const recordsResponse = await client.bitable.appTableRecord.list({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID
      },
      params: {
        page_size: 100
      }
    });

    console.log('Records response:', JSON.stringify(recordsResponse, null, 2));

    if (!recordsResponse.data?.items) {
      throw new Error('Failed to get records');
    }

    // Step 4: Update each record with the appropriate category selection
    console.log('\n4. Updating records with category selections...');
    
    for (const record of recordsResponse.data.items) {
      const currentCategory = record.fields[categoryField.field_id || ''];
      let newCategoryValue = null;

      // Map text categories to selection options
      if (typeof currentCategory === 'string' && currentCategory) {
        const categoryMapping: { [key: string]: string } = {
          'electronics': '電子製品',
          'electronic': '電子製品',
          '電子製品': '電子製品',
          '电子产品': '電子製品',
          'books': '書籍',
          'book': '書籍',
          '書籍': '書籍',
          '书籍': '書籍',
          'clothing': '衣料品',
          'clothes': '衣料品',
          '衣料品': '衣料品',
          '服装': '衣料品',
          'food': '食品',
          '食品': '食品',
          '食物': '食品',
          'other': 'その他',
          'others': 'その他',
          'その他': 'その他',
          '其他': 'その他'
        };

        const mappedCategory = categoryMapping[currentCategory.toLowerCase()] || 'その他';
        newCategoryValue = mappedCategory;
      } else if (!currentCategory) {
        // If category is empty, set it to 'その他' (Other)
        newCategoryValue = 'その他';
      }

      if (newCategoryValue) {
        console.log(`\nUpdating record ${record.record_id}: ${currentCategory} -> ${newCategoryValue}`);
        
        try {
          const updateRecordResponse = await client.bitable.appTableRecord.update({
            path: {
              app_token: APP_TOKEN,
              table_id: TABLE_ID,
              record_id: record.record_id || ''
            },
            data: {
              fields: {
                [categoryField.field_id || '']: newCategoryValue
              }
            }
          });
          
          console.log(`Record ${record.record_id} updated successfully`);
        } catch (error) {
          console.error(`Failed to update record ${record.record_id}:`, error);
        }
      }
    }

    console.log('\n✅ Bitable category update completed successfully!');
  } catch (error) {
    console.error('❌ Error updating Bitable:', error);
    throw error;
  }
}

// Run the update
updateBitableCategories().catch(console.error);